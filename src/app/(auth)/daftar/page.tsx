"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { registerSiswa } from "@/lib/session";
import PasswordInput from "../PasswordInput";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const isLoading = isSubmitting || isNavigating;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const err = await registerSiswa(name, username, password);
    setIsSubmitting(false);
    if (err) return setError(err);
    // reset bersama navigasi, supaya form tidak tersisa saat halaman ini dibuka lagi setelah keluar
    startNavigation(() => {
      router.replace("/beranda");
      setName("");
      setUsername("");
      setPassword("");
    });
  };

  const clearError = () => error && setError("");

  return (
    <>
      <div className={styles.greeting}>
        <h2>Buat akun siswa</h2>
        <p>Cuma butuh satu menit, lalu mulai menulis.</p>
      </div>

      <form onSubmit={handleRegister} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Nama lengkap</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError(); }}
            required
          />
        </div>

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
            aria-describedby="username-hint"
            required
          />
          <p id="username-hint" className={styles.hint}>Huruf kecil dan angka, tanpa spasi.</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            aria-describedby="password-hint"
            required
          />
          <p id="password-hint" className={styles.hint}>Minimal 6 karakter.</p>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? <Loader2 size={20} className={styles.spin} aria-label="Memproses" /> : "Daftar"}
        </button>
      </form>

      <p className={styles.altText}>
        Sudah punya akun? <Link href="/masuk">Masuk</Link>
      </p>
    </>
  );
}
