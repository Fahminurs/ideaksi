"use client";

// Kalau sudah login, jangan tampilkan halaman masuk/daftar: kembali ke halaman terakhir.
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { lastPath } from "@/lib/session";
import { useUser } from "@/lib/useUser";

export default function RedirectIfLoggedIn() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    // lastPath hanya diisi oleh layout siswa
    router.replace(user.role === "siswa" ? (lastPath() ?? "/beranda") : "/guru/beranda");
  }, [user, router]);

  return null;
}
