"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, FileDown, Plus, Trash2, X } from "lucide-react";
import { STAGES } from "@/lib/stages";
import { createArticle, deleteArticle, useArticles, type Article } from "@/lib/articles";
import { countWords } from "@/lib/ai";
import styles from "./menulis.module.css";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const titleOf = (a: Article) => a.revision?.title || a.draft?.title || a.topic?.text || "Artikel tanpa judul";

// Tombol hapus: muncul saat kartu di-hover (selalu tampil di layar sentuh).
// Klik pertama membuka konfirmasi kecil "Hapus?"; tutup otomatis setelah 4 detik.
function DeleteButton({ a }: { a: Article }) {
  const [asking, setAsking] = useState(false);
  const title = titleOf(a);

  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => setAsking(false), 4000);
    return () => clearTimeout(t);
  }, [asking]);

  return (
    <div className={styles.deleteWrap} data-asking={asking || undefined}>
      {asking ? (
        <div className={styles.confirm} role="group" aria-label={`Hapus ${title}?`}>
          <span>Hapus?</span>
          <button type="button" className={styles.confirmYes} onClick={() => deleteArticle(a.id)} aria-label="Ya, hapus">
            <Check size={16} strokeWidth={3} aria-hidden />
          </button>
          <button type="button" className={styles.confirmNo} onClick={() => setAsking(false)} aria-label="Batal">
            <X size={16} strokeWidth={3} aria-hidden />
          </button>
        </div>
      ) : (
        <button type="button" className={styles.deleteBtn} onClick={() => setAsking(true)} aria-label={`Hapus artikel ${title}`} title="Hapus">
          <Trash2 size={19} aria-hidden />
        </button>
      )}
    </div>
  );
}

export default function MenulisPage() {
  const articles = useArticles();
  const router = useRouter();
  const [filter, setFilter] = useState<"semua" | "proses" | "selesai">("semua");
  if (!articles) return null; // menunggu localStorage
  const drafts = articles.filter((a) => !a.doneAt);
  const done = articles.filter((a) => a.doneAt);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Artikel saya</h1>
          <p>Riwayat semua artikelmu, yang terbaru di atas.</p>
        </div>
      </header>

      {/* desktop: filter + tombol baru melayang (sticky) di atas; HP: tombol baru melayang di kanan bawah */}
      <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Saring artikel">
        {([
          ["semua", "Semua", articles.length],
          ["proses", "Dikerjakan", drafts.length],
          ["selesai", "Selesai", done.length],
        ] as const).map(([key, label, n]) => (
          <button key={key} type="button" data-kind={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            <span className={styles.filterCount}>{n}</span>
            <span className={styles.filterLabel}>
              <span className={styles.filterDot} aria-hidden />
              {label}
            </span>
          </button>
        ))}
      </div>
          {/* artikel dibuat saat diklik, langsung ke Tahap 1 tanpa halaman perantara */}
          <button type="button" className={styles.newBtn} onClick={() => router.push(`/menulis/${createArticle().id}/tahap/1`)}>
            <Plus size={20} aria-hidden /> Mulai artikel baru
          </button>
      </div>

      {filter !== "selesai" && (
      <section className={styles.section} aria-labelledby="draft-h">
        <h2 id="draft-h" className={styles.sectionTitle}>
          Sedang dikerjakan <span className={styles.count}>{drafts.length}</span>
        </h2>
        {drafts.length === 0 && <p className={styles.empty}>Tidak ada artikel yang sedang dikerjakan.</p>}
        <ul className={styles.list}>
          {drafts.map((a, i) => {
            const percent = Math.round(((a.stage - 1) / STAGES.length) * 100);
            return (
              <li key={a.id} className={styles.draft}>
                <span className={styles.cardNo}>
                  <b>{i + 1}</b> Dikerjakan
                </span>
                <div className={styles.draftMain}>
                  <div
                    className={styles.ring}
                    style={{ "--p": percent } as React.CSSProperties}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progres artikel ${percent}%`}
                  >
                    <span>
                      <strong>{percent}%</strong>
                      <small>{a.stage - 1}/{STAGES.length} tahap</small>
                    </span>
                  </div>
                  <div className={styles.titleBlock}>
                    <h3 className={styles.title}>{titleOf(a)}</h3>
                    <p className={styles.now}>
                      Sedang di tahap <strong>{STAGES[a.stage - 1].label}</strong>
                    </p>
                    <p className={styles.meta}>Diedit {formatDate(a.updated)}</p>
                  </div>
                  <div className={styles.cardActions}>
                    <Link href={`/menulis/${a.id}/tahap/${a.stage}`} className={styles.resume}>
                      Lanjutkan
                    </Link>
                    <DeleteButton a={a} />
                  </div>
                </div>

                <ol className={styles.path} aria-label="Jalur tahap menulis">
                  {STAGES.map(({ short, label, icon: Icon }, k) => {
                    const n = k + 1;
                    const state = n < a.stage ? "done" : n === a.stage ? "now" : "todo";
                    return (
                      <li key={short} data-state={state} aria-current={state === "now" ? "step" : undefined}>
                        <span className={styles.node} title={label}>
                          {state === "done" ? <Check size={16} strokeWidth={3} aria-hidden /> : <Icon size={16} aria-hidden />}
                        </span>
                        <span className={styles.nodeLabel}>{short}</span>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ul>
      </section>
      )}

      {filter !== "proses" && (
      <section className={styles.section} aria-labelledby="done-h">
        <h2 id="done-h" className={styles.sectionTitle}>
          Artikel selesai <span className={styles.count}>{done.length}</span>
        </h2>
        {done.length === 0 && <p className={styles.empty}>Belum ada. Selesaikan 6 tahap untuk mendapat artikel pertamamu!</p>}
        <ul className={styles.list}>
          {done.map((a, i) => (
            <li key={a.id} className={styles.done}>
              <span className={styles.cardNo}>
                <b>{drafts.length + i + 1}</b> Selesai
              </span>
              <CircleCheck size={24} className={styles.doneIcon} aria-hidden />
              <div className={styles.doneBody}>
                <h3 className={styles.doneTitle}>{titleOf(a)}</h3>
                <p className={styles.meta}>
                  Selesai {formatDate(a.doneAt!)}, {countWords(a.revision?.body ?? a.draft?.body ?? "")} kata
                </p>
              </div>
              <div className={styles.actions}>
                <Link href={`/menulis/${a.id}/tahap/6`} className={styles.ghostBtn}>Lihat</Link>
                <Link href={`/menulis/${a.id}/tahap/6`} className={styles.pdfBtn}>
                  <FileDown size={18} aria-hidden /> Unduh PDF
                </Link>
                <DeleteButton a={a} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      )}
    </>
  );
}
