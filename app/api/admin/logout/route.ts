import { expiredSessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return Response.redirect(new URL("/admin/login", request.url), 303, {
    headers: { "Set-Cookie": expiredSessionCookie() },
  });
}