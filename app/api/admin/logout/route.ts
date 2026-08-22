import { expiredSessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/admin/login", request.url).toString(),
      "Set-Cookie": expiredSessionCookie(),
    },
  });
}