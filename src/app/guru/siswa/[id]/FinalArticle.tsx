"use client";

import { useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import styles from "../../dashboard.module.css";

// Artikel final siswa: tampil/sembunyi + cetak (Simpan sebagai PDF).
export default function FinalArticle({ title, author, body }: { title: string; author: string; body: string }) {
  const [open, setOpen] = useState(false);

  const print = () => {
    setOpen(true);
    requestAnimationFrame(() => window.print()); // tunggu kertas tampil dulu
  };

  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          {open ? "Tutup artikel" : "Lihat artikel final"}
        </button>
        <button type="button" className={styles.solidBtn} onClick={print}>
          <Download size={18} aria-hidden /> Unduh PDF
        </button>
      </div>
      {open && (
        <article className={styles.paper} data-print-area>
          <h3>{title}</h3>
          <p className={styles.byline}>Oleh {author} · Kelas VIII</p>
          {body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </article>
      )}
    </>
  );
}
