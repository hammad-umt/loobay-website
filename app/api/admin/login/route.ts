import { checkAdminCredentials, createAdminSession, sessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Enter your admin credentials." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const username = typeof record.username === "string" ? record.username : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!(await checkAdminCredentials(username, password))) {
    return Response.json({ ok: false, message: "The username or password is incorrect." }, { status: 401 });
  }

  const session = createAdminSession(username);
  if (!session) {
    return Response.json({ ok: false, message: "Admin authentication is not configured." }, { status: 503 });
  }

  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(session) } });
}