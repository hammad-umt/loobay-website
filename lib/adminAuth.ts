import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

import { findAdminUser } from "@/lib/issueStore";

export const ADMIN_SESSION_COOKIE = "loobay_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function secret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();
}

function matchesSecret(value: string, expected: string): boolean {
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, expectedHash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHash) return false;

  try {
    const actualHash = scryptSync(password, salt, 64).toString("hex");
    return matchesSecret(actualHash, expectedHash);
  } catch {
    return false;
  }
}

export async function checkAdminCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim();
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (
    expectedUsername && expectedPassword &&
    matchesSecret(username, expectedUsername) && matchesSecret(password, expectedPassword)
  ) {
    return true;
  }

  try {
    const user = await findAdminUser(username);
    if (user) return verifyPassword(password, user.password_hash);
  } catch {
  }

  return false;
}

export function createAdminSession(username: string): string | undefined {
  const sessionSecret = secret();

  if (!sessionSecret || !username) return undefined;

  const normalizedUsername = username.trim().toLowerCase();
  const signature = createHmac("sha256", sessionSecret)
    .update(`loobay-admin:${normalizedUsername}`)
    .digest("hex");
  return `${normalizedUsername}.${signature}`;
}

export function isAdminSession(request: Request): boolean {
  const sessionSecret = secret();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const session = cookieHeader.split(";").map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);

  if (!sessionSecret || !session) return false;
  const separator = session.lastIndexOf(".");
  if (separator < 1) return false;
  const username = session.slice(0, separator);
  const signature = session.slice(separator + 1);
  const expectedSignature = createHmac("sha256", sessionSecret)
    .update(`loobay-admin:${username}`)
    .digest("hex");

  return matchesSecret(signature, expectedSignature);
}

export function sessionCookie(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function expiredSessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}