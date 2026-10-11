"use client";

import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

// Ikon & label diatur CSS sesuai tema aktif, jadi tidak perlu state (tidak ada salah tampil saat hidrasi).
function applyTheme() {
  const root = document.documentElement;
  const current =
    root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("ideaksi_theme", next);
  } catch {}
}

// Tema baru menyebar berbentuk lingkaran dari tombol yang diklik (View Transitions API).
// Browser tanpa dukungan / pengguna "kurangi gerakan" -> langsung ganti tanpa animasi.
function toggleTheme(e: React.MouseEvent<HTMLButtonElement>) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return applyTheme();
  }
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  document.startViewTransition(applyTheme).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

export default function ThemeToggle({
  withLabel = false,
  className = "",
  labelClassName = "",
  short = false,
}: { withLabel?: boolean; className?: string; labelClassName?: string; short?: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      onClick={toggleTheme}
      aria-label="Ganti mode terang atau gelap"
      title="Ganti mode terang/gelap"
    >
      <span className={styles.icons} aria-hidden>
        <Moon size={20} className={styles.moonIcon} />
        <Sun size={20} className={styles.sunIcon} />
      </span>
      {withLabel && (
        <span className={labelClassName}>
          <span className={styles.moon}>{short ? "Gelap" : "Mode gelap"}</span>
          <span className={styles.sun}>{short ? "Terang" : "Mode terang"}</span>
        </span>
      )}
    </button>
  );
}
