"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenText, Check, Clock, Download, PartyPopper, PenLine, Save } from "lucide-react";
import { saveArticle, type Article } from "@/lib/articles";
import { countWords, partOf, readMinutes } from "@/lib/ai";
import { useUser } from "@/lib/useUser";
import { stageVars } from "@/lib/stages";
import { FieldError, goTo } from "./FieldError";
import AutoText from "./AutoText";
import styles from "./tahap.module.css";

const CHECKS = [
  "Ejaan dan tanda baca sudah benar",
  "Fakta sesuai dengan sumbernya",
  "Alur dari pendahuluan ke penutup runtut",
  "Setiap sumber disebut di dalam kalimat",
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const paragraphsOf = (s: string) => s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export default function Step6Revise({ article }: { article: Article }) {
  const user = useUser();
  const draft = article.draft ?? { title: "", body: "" };
  const saved = article.revision ?? { title: draft.title, body: draft.body, count: 0, checks: CHECKS.map(() => false) };

  const [title, setTitle] = useState(saved.title);
  const [body, setBody] = useState(saved.body);
  const [checks, setChecks] = useState(saved.checks);
  const [tab, setTab] = useState<"asli" | "revisi">("revisi");
  const [note, setNote] = useState("");

  const dirty = title !== saved.title || body !== saved.body;
  const count = saved.count + (dirty ? 1 : 0);
  const allChecked = checks.every(Boolean);
  const done = Boolean(article.doneAt);

  const save = (extra: Partial<Article> = {}) => {
    saveArticle({ ...article, revision: { title: title.trim(), body, count, checks }, ...extra });
  };

  const toggle = (i: number) => {
    const next = checks.map((c, k) => (k === i ? !c : c));
    setNote("");
    setChecks(next);
    saveArticle({ ...article, revision: { ...saved, checks: next } });
  };

  const finish = () => {
    if (!allChecked) {
      setNote("Centang semua daftar cek revisi dulu sebelum menandai selesai.");
      return goTo("checklist");
    }
    save({ doneAt: new Date().toISOString() });
    setNote("");
  };

  const download = () => {
    save();
    window.print(); // ponytail: PDF lewat dialog cetak browser ("Simpan sebagai PDF"); pakai pustaka PDF kalau butuh unduh langsung
  };

  if (!article.draft) {
    return (
      <div className={styles.notice}>
        <p>Belum ada draft. Buat draft di Tahap 5 dulu.</p>
        <Link href={`/menulis/${article.id}/tahap/5`} className={styles.noticeLink}>Buka Tahap 5</Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      {done && (
        <div className={styles.doneBanner} role="status">
          <PartyPopper size={28} aria-hidden />
          <div>
            <strong>Artikelmu selesai!</strong>
            <span>Hebat, kamu sudah menulis artikel ilmiah populer sendiri.</span>
          </div>
        </div>
      )}

      <section className={styles.panel} aria-labelledby="rev-h">
      <h2 id="rev-h" className={styles.panelTitle}>Perbaiki tulisanmu</h2>
      <p className={styles.lead}>Baca ulang draft dari Dea, lalu perbaiki dengan kata-katamu sendiri.</p>

      <div className={styles.tabs} role="tablist" aria-label="Pilih tampilan">
        <button type="button" role="tab" aria-selected={tab === "asli"} onClick={() => setTab("asli")}>Draft dari Dea</button>
        <button type="button" role="tab" aria-selected={tab === "revisi"} onClick={() => setTab("revisi")}>
          <PenLine size={16} aria-hidden /> Revisimu
        </button>
      </div>

      <div className={styles.compare} data-tab={tab}>
        <section className={styles.original} aria-label="Draft asli dari Dea">
          <span className={styles.paneLabel}>Draft dari Dea <small>hanya dibaca</small></span>
          <h3>{draft.title}</h3>
          {paragraphsOf(draft.body).map((p, i) => <p key={i}>{p}</p>)}
        </section>

        <section className={styles.revise} aria-label="Revisimu">
          <label htmlFor="rev-title" className={styles.paneLabel}>Revisimu <small>bisa diedit</small></label>
          <textarea id="rev-title" className={`${styles.titleInput} ${styles.titleArea}`} rows={2} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul" />
          <AutoText
            className={`${styles.plainEdit} ${styles.reviseArea}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Isi artikel"
          />
        </section>
      </div>

      <div className={styles.stats}>
        <span><BookOpenText size={16} aria-hidden /> {countWords(body)} kata</span>
        <span><Clock size={16} aria-hidden /> ±{readMinutes(body)} menit baca</span>
        <span><PenLine size={16} aria-hidden /> {count ? `Revisi ke-${count}` : "Belum direvisi"}</span>
        <button type="button" className={styles.saveBtn} onClick={() => save()} disabled={!dirty}>
          <Save size={16} aria-hidden /> {dirty ? "Simpan revisi" : "Tersimpan"}
        </button>
      </div>
      </section>

      <fieldset className={styles.card} id="checklist">
        <legend className={styles.cardTitle}>Daftar cek revisi <small className={styles.optional}>{checks.filter(Boolean).length}/{CHECKS.length}</small></legend>
        <ul className={styles.checklist}>
          {CHECKS.map((c, i) => (
            <li key={c}>
              <label data-on={checks[i] || undefined}>
                <input type="checkbox" checked={checks[i]} onChange={() => toggle(i)} />
                <span className={styles.checkBox} aria-hidden>{checks[i] && <Check size={15} strokeWidth={3.5} />}</span>
                {c}
              </label>
            </li>
          ))}
        </ul>
        <FieldError>{note}</FieldError>
      </fieldset>

      <section className={styles.panel} aria-label="Pratinjau artikel final">
        <h2 className={styles.panelTitle}>Pratinjau artikel final</h2>
        <article className={`${styles.paper} ${styles.finalPaper}`} data-print-area>
          <header className={styles.finalHead}>
            <h2>{title || "Tanpa judul"}</h2>
            <p>Oleh {user?.name ?? "Siswa"} · Kelas VIII · {formatDate(article.doneAt ?? article.updated)}</p>
          </header>
          {paragraphsOf(body).map((p, i, all) => (
            <div key={i} className={styles.paperPart} style={stageVars(partOf(i, all.length).stage)}>
              <p>{p}</p>
            </div>
          ))}
        </article>
      </section>


      <div className={styles.finalActions}>
        <button type="button" className={styles.secondaryBtn} onClick={download}>
          <Download size={18} aria-hidden /> Unduh PDF
        </button>
        <button type="button" className={styles.primaryBtn} onClick={finish} disabled={done && !dirty}>
          <Check size={18} aria-hidden /> {done ? (dirty ? "Simpan perubahan" : "Sudah selesai") : "Tandai selesai"}
        </button>
      </div>

      <div className={styles.footer}>
        <Link href={`/menulis/${article.id}/tahap/5`} className={styles.secondaryBtn}>Sebelumnya</Link>
        <Link href="/menulis" className={styles.secondaryBtn}>Ke daftar artikel</Link>
      </div>
    </div>
  );
}
