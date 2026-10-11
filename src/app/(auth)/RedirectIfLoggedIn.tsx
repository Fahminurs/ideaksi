"use client";

// Sudah login tapi membuka halaman masuk/daftar.
// Mode API: proxy.ts sudah mengalihkan yang sesinya sah, jadi sesi lokal yang tersisa di sini basi -> dibuang.
// Mode lokal: kembali ke halaman terakhir.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiEnabled } from "@/lib/api";
import { forgetLocalSession, lastPath } from "@/lib/session";
import { useUser } from "@/lib/useUser";

export default function RedirectIfLoggedIn() {
  const user = useUser();
  const router = useRouter();
  const checked = useRef(false); // hanya cek sesi yang ada saat halaman dibuka, bukan hasil login barusan

  useEffect(() => {
    if (user === undefined || checked.current) return;
    checked.current = true;
    if (!user) return;
    if (apiEnabled) return forgetLocalSession();
    // lastPath hanya diisi oleh layout siswa
    router.replace(user.role === "siswa" ? (lastPath() ?? "/beranda") : "/guru/beranda");
  }, [user, router]);

  return null;
}
