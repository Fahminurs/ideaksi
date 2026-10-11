// Penjaga rute (setara middleware Laravel), berjalan di server sebelum halaman dirender:
// - belum login        -> halaman siswa/guru dialihkan ke /masuk
// - sudah login        -> /masuk, /daftar, dan / dialihkan ke beranda sesuai role
// - role tidak cocok   -> siswa tidak bisa membuka /guru, guru tidak bisa membuka halaman siswa
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyAuth, type Role } from "@/server/authCookie";

const HOME: Record<Role, string> = { siswa: "/beranda", guru: "/guru/beranda" };
const GUEST_ONLY = ["/", "/masuk", "/daftar"];
const SISWA = ["/beranda", "/menulis", "/materi", "/contoh", "/kuis", "/tanya-dea", "/profil"];

const under = (path: string, bases: string[]) => bases.some((b) => path === b || path.startsWith(b + "/"));

export async function proxy(request: NextRequest) {
  // mode lokal (tanpa backend): sesi hanya di browser, tidak ada yang bisa diperiksa server
  if (!process.env.NEXT_PUBLIC_API_URL) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const role = await verifyAuth(request.cookies.get(AUTH_COOKIE)?.value);
  const go = (to: string) => NextResponse.redirect(new URL(to, request.url));

  if (GUEST_ONLY.includes(pathname)) return role ? go(HOME[role]) : pathname === "/" ? go("/masuk") : NextResponse.next();
  if (!role) return go("/masuk");
  if (under(pathname, ["/guru"]) && role !== "guru") return go(HOME[role]);
  if (under(pathname, SISWA) && role !== "siswa") return go(HOME[role]);
  return NextResponse.next();
}

export const config = {
  // harus berupa nilai tetap (dibaca saat build)
  matcher: [
    "/", "/masuk", "/daftar", "/guru/:path*",
    "/beranda", "/beranda/:path*",
    "/menulis", "/menulis/:path*",
    "/materi", "/materi/:path*",
    "/contoh", "/contoh/:path*",
    "/kuis", "/kuis/:path*",
    "/tanya-dea", "/tanya-dea/:path*",
    "/profil", "/profil/:path*",
  ],
};
