"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { login, type Role } from "@/lib/session";
import PasswordInput from "../PasswordInput";
import styles from "../auth.module.css";

const COPY = {
  siswa: { title: "Halo, penulis muda!", sub: "Masuk untuk lanjut menulis artikelmu." },
  guru: { title: "Halo, Bapak/Ibu Guru!", sub: "Masuk untuk memantau tulisan siswa." },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("siswa");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const isLoading = isSubmitting || isNavigating;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const err = await login(role, username, password);
    setIsSubmitting(false);
    if (err) return setError(err);
    // Next menyimpan state halaman ini selama pengguna di dalam aplikasi; tanpa reset, setelah keluar
    // form masih terisi dan tombol masih berputar. Update di dalam transisi ikut selesai bersama navigasi.
    startNavigation(() => {
      router.replace(role === "guru" ? "/guru/beranda" : "/beranda");
      setUsername("");
      setPassword("");
    });
  };

  const clearError = () => error && setError("");

  return (
    <>
      <div className={styles.greeting}>
        <h2>{COPY[role].title}</h2>
        <p>{COPY[role].sub}</p>
      </div>

      <div className={styles.roleSwitch} role="radiogroup" aria-label="Masuk sebagai">
        {(["siswa", "guru"] as const).map((r) => (
          <label key={r}>
            <input
              type="radio"
              name="role"
              value={r}
              checked={role === r}
              onChange={() => { setRole(r); clearError(); }}
            />
            {r === "siswa" ? "Siswa" : "Guru"}
          </label>
        ))}
      </div>

      <form onSubmit={handleLogin} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearError(); }}
            aria-invalid={!!error}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
          {error && <p id="login-error" className={styles.error} role="alert">{error}</p>}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? <Loader2 size={20} className={styles.spin} aria-label="Memproses" /> : "Masuk"}
        </button>
      </form>

      {role === "siswa" ? (
        <p className={styles.altText}>
          Belum punya akun? <Link href="/daftar">Daftar</Link>
        </p>
      ) : (
        <p className={styles.altText}>Akun guru dibuat oleh admin sekolah.</p>
      )}
    </>
  );
}
