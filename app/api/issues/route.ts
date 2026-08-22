import { createHash } from "node:crypto";

import { IssueStoreError, saveIssue } from "@/lib/issueStore";
import {
  isIssueCategory,
  type IssueCategory,
  type NewIssue,
} from "@/lib/siteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1_024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_KEYS = 5_000;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/u;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

interface ValidatedIssue {
  issue: NewIssue;
  email: string;
}

type ValidationResult =
  | { ok: true; value: ValidatedIssue }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
      honeypot?: boolean;
    };

const rateLimits = new Map<string, RateLimitEntry>();
let lastRateLimitCleanup = 0;

function json(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: { ...RESPONSE_HEADERS, ...headers },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateIssueBody(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return { ok: false, message: "Send a valid issue report." };
  }

  if (typeof body.website !== "undefined") {
    if (typeof body.website !== "string" || body.website.trim().length > 0) {
      return {
        ok: false,
        message: "This issue report could not be submitted.",
        honeypot: true,
      };
    }
  }

  const fieldErrors: Record<string, string> = {};
  let name: string | undefined;

  if (typeof body.name === "string") {
    const normalizedName = body.name.trim();

    if (normalizedName.length > 100) {
      fieldErrors.name = "Name must be 100 characters or fewer.";
    } else if (normalizedName.length > 0) {
      name = normalizedName;
    }
  } else if (body.name !== undefined && body.name !== null) {
    fieldErrors.name = "Name must be text.";
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const category: IssueCategory | undefined = isIssueCategory(body.category)
    ? body.category
    : undefined;

  if (!category) {
    fieldErrors.category = "Choose a valid issue category.";
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    fieldErrors.message = "Tell us what happened.";
  } else if (message.length < 10) {
    fieldErrors.message = "Please include at least 10 characters.";
  } else if (message.length > 4_000) {
    fieldErrors.message = "Message must be 4,000 characters or fewer.";
  }

  if (body.consent !== true) {
    fieldErrors.consent = "Consent is required before submitting.";
  }

  if (Object.keys(fieldErrors).length > 0 || !category) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    value: {
      email,
      issue: {
        ...(name ? { name } : {}),
        email,
        category,
        message,
      },
    },
  };
}

function requestIdentity(request: Request, email: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const networkIdentity =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwardedFor;
  const transientIdentity = networkIdentity
    ? `network:${networkIdentity.slice(0, 128)}`
    : `email:${email}`;

  return createHash("sha256")
    .update(`loobay-issue-rate-limit:${transientIdentity}`)
    .digest("hex");
}

function cleanupRateLimits(now: number): void {
  if (now - lastRateLimitCleanup < RATE_LIMIT_WINDOW_MS) {
    return;
  }

  lastRateLimitCleanup = now;

  for (const [key, entry] of rateLimits) {
    if (now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      rateLimits.delete(key);
    }
  }

}

function makeRoomForRateLimit(): void {
  while (rateLimits.size >= RATE_LIMIT_MAX_KEYS) {
    const oldestKey = rateLimits.keys().next().value as string | undefined;

    if (!oldestKey) {
      break;
    }

    rateLimits.delete(oldestKey);
  }
}

function consumeRateLimit(
  key: string,
  now = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  cleanupRateLimits(now);
  const entry = rateLimits.get(key);

  if (!entry || now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    if (!entry) {
      makeRoomForRateLimit();
    }

    rateLimits.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (RATE_LIMIT_WINDOW_MS - (now - entry.windowStartedAt)) / 1_000,
        ),
      ),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, message: "The issue report is too large." }, 413);
  }

  let body: unknown;

  try {
    const text = await request.text();

    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
      return json({ ok: false, message: "The issue report is too large." }, 413);
    }

    body = JSON.parse(text) as unknown;
  } catch {
    return json({ ok: false, message: "Send a valid JSON issue report." }, 400);
  }

  const validation = validateIssueBody(body);

  if (!validation.ok) {
    return json(
      {
        ok: false,
        message: validation.message,
        ...(validation.fieldErrors ? { fieldErrors: validation.fieldErrors } : {}),
      },
      400,
    );
  }

  const rateLimit = consumeRateLimit(requestIdentity(request, validation.value.email));

  if (!rateLimit.allowed) {
    return json(
      {
        ok: false,
        message: "Too many issue reports were submitted. Please try again later.",
      },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  try {
    const issue = await saveIssue(validation.value.issue);
    return json({ ok: true, reference: issue.reference }, 201);
  } catch (error) {
    if (error instanceof IssueStoreError && error.code === "NOT_CONFIGURED") {
      console.error("[issues] Supabase support storage is not configured.");
      return json(
        { ok: false, message: "Issue reporting is temporarily unavailable." },
        503,
      );
    }

    console.error("[issues] Unable to save an issue report.", error);
    return json(
      { ok: false, message: "Your issue could not be submitted. Please try again." },
      500,
    );
  }
}
