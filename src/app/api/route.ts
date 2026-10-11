// Satu pintu API: POST {"action": "...", "token": "...", ...}. Logikanya di src/server/api.ts.
// Login/daftar juga memasang cookie bertanda tangan untuk penjaga rute (src/proxy.ts); logout menghapusnya.
import { NextResponse } from "next/server";
import { handle } from "@/server/api";
import { AUTH_COOKIE, AUTH_MAX_AGE, signAuth, type Role } from "@/server/authCookie";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(await request.text());
  } catch {}

  const result = await handle(body);
  const res = NextResponse.json(result);

  if (body.action === "auth.logout") {
    res.cookies.delete(AUTH_COOKIE);
  } else if (result.ok && (body.action === "auth.login" || body.action === "auth.register")) {
    const role = (result.data as { user: { role: Role } }).user.role;
    res.cookies.set(AUTH_COOKIE, await signAuth(role), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_MAX_AGE,
    });
  }
  return res;
}
