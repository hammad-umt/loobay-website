import "server-only";

import { randomBytes } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  assertNewIssue,
  type NewIssue,
  type StoredIssue,
} from "@/lib/siteStore";

const MAX_REFERENCE_ATTEMPTS = 5;
const CONSENT_NOTICE_VERSION = "issue-form-v1";

type IssueReportRow = {
  id: string;
  reference: string;
  name: string | null;
  email: string;
  category: string;
  message: string;
  status: string;
  consent: boolean;
  consent_notice_version: string;
  created_at: string;
};

type Database = {
  public: {
    Tables: {
      issue_reports: {
        Row: IssueReportRow;
        Insert: Omit<IssueReportRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<IssueReportRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
  };
};

type IssueStoreErrorCode =
  | "NOT_CONFIGURED"
  | "WRITE_FAILED"
  | "INVALID_RESPONSE";

export class IssueStoreError extends Error {
  readonly code: IssueStoreErrorCode;
  readonly cause?: unknown;

  constructor(code: IssueStoreErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "IssueStoreError";
    this.code = code;
    this.cause = cause;
  }
}

let adminClient: SupabaseClient<Database> | undefined;

function getSupabaseAdmin() {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new IssueStoreError(
      "NOT_CONFIGURED",
      "Supabase support storage is not configured.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new IssueStoreError(
      "NOT_CONFIGURED",
      "SUPABASE_URL must be a valid URL.",
    );
  }

  const isLocal =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "::1";

  if (parsedUrl.protocol !== "https:" && !(isLocal && parsedUrl.protocol === "http:")) {
    throw new IssueStoreError(
      "NOT_CONFIGURED",
      "SUPABASE_URL must use HTTPS outside local development.",
    );
  }

  adminClient = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return adminClient;
}

function makeIssueReference(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `LBY-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function isStoredResult(
  value: unknown,
): value is { reference: string; created_at: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "reference" in value &&
    typeof value.reference === "string" &&
    "created_at" in value &&
    typeof value.created_at === "string" &&
    Number.isFinite(Date.parse(value.created_at))
  );
}

export async function saveIssue(input: NewIssue): Promise<StoredIssue> {
  assertNewIssue(input);
  const supabase = getSupabaseAdmin();

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    const reference = makeIssueReference();
    const { data, error } = await supabase
      .from("issue_reports")
      .insert({
        reference,
        name: input.name ?? null,
        email: input.email,
        category: input.category,
        message: input.message,
        status: "received",
        consent: true,
        consent_notice_version: CONSENT_NOTICE_VERSION,
      })
      .select("reference, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        continue;
      }

      throw new IssueStoreError(
        "WRITE_FAILED",
        "Supabase could not store the issue report.",
        error,
      );
    }

    if (!isStoredResult(data)) {
      throw new IssueStoreError(
        "INVALID_RESPONSE",
        "Supabase returned an invalid issue record.",
      );
    }

    return {
      ...input,
      reference: data.reference,
      status: "received",
      timestamp: data.created_at,
      consent: true,
    };
  }

  throw new IssueStoreError(
    "WRITE_FAILED",
    "Unable to allocate a unique issue reference.",
  );
}
