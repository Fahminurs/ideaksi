"use client";

import { useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { downloadArticlePdf } from "@/lib/pdf";
import styles from "../../dashboard.module.css";

// Artikel final siswa: tampil/sembunyi + unduh PDF langsung.
export default function FinalArticle({ title, author, body, date }: { title: string; author: string; body: string; date: string }) {
  const [open, setOpen] = useState(false);
  const download = () => downloadArticlePdf({ title, author, body, date });

  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          {open ? "Tutup artikel" : "Lihat artikel final"}
        </button>
        <button type="button" className={styles.solidBtn} onClick={download}>
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
