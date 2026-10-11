"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Lightbulb, Plus, Trash2 } from "lucide-react";
import { saveArticle, type Article, type Fact } from "@/lib/articles";
import styles from "./tahap.module.css";

const MIN = 3;
const SOURCES = ["Kemenkes", "BPS", "BMKG", "WHO", "UNICEF", "KLHK"];
// kata yang biasanya menandai opini, bukan fakta
const OPINION = /\b(menurut saya|saya rasa|saya pikir|sebaiknya|seharusnya|harus|pasti|paling bagus|paling buruk|sangat bagus|sangat buruk)\b/i;
const YEAR = /\b(19|20)\d{2}\b/;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const isComplete = (f: Fact) => wordCount(f.fact) >= 5 && f.source.trim().length >= 2;
const isEmpty = (f: Fact) => !f.fact.trim() && !f.source.trim();

export default function Step3Facts({ article }: { article: Article }) {
  const router = useRouter();
  const saved = article.facts ?? [];
  const [facts, setFacts] = useState<Fact[]>(
    saved.length >= MIN ? saved : [...saved, ...Array(MIN - saved.length).fill({ fact: "", source: "" })],
  );
  const [error, setError] = useState("");

  const done = facts.filter(isComplete).length;
  const subs = article.question?.subs ?? [];

  const update = (i: number, patch: Partial<Fact>) => {
    setFacts((list) => list.map((f, k) => (k === i ? { ...f, ...patch } : f)));
    setError("");
  };

  const addSource = (i: number, name: string) => {
    const year = facts[i].source.match(YEAR)?.[0];
    update(i, { source: `${name}, ${year ?? ""}`.trimEnd() });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = facts.filter((f) => !isEmpty(f));
    if (filled.some((f) => !isComplete(f))) {
      return setError("Ada kartu yang belum lengkap. Setiap fakta minimal 5 kata dan harus ada sumbernya.");
    }
    if (filled.length < MIN) return setError(`Kumpulkan minimal ${MIN} fakta dulu, ya.`);
    saveArticle({
      ...article,
      facts: filled.map((f) => ({ fact: f.fact.trim(), source: f.source.trim() })),
      stage: Math.max(article.stage, 4),
    });
    router.push(`/menulis/${article.id}/tahap/4`);
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <p className={styles.lead}>Tulis fakta yang menjawab pertanyaanmu, lalu cantumkan dari mana fakta itu berasal.</p>

      <div className={`${styles.topicCard} ${styles.questionCard}`}>
        <span className={styles.topicLabel}>Pertanyaanmu</span>
        <strong>{article.question?.main || "Belum ada pertanyaan"}</strong>
        <Link href={`/menulis/${article.id}/tahap/2`} className={styles.topicEdit}>Ubah</Link>
        {subs.length > 0 && (
          <ul className={styles.subHints} aria-label="Sub-pertanyaan">
            {subs.map((s) => <li key={s}>{s}</li>)}
          </ul>
        )}
      </div>

      <div className={styles.factMeter} aria-live="polite">
        <ol aria-hidden>
          {Array.from({ length: Math.max(MIN, facts.length) }, (_, i) => (
            <li key={i} data-on={i < done || undefined}>{i < done ? <Check size={14} strokeWidth={3.5} /> : i + 1}</li>
          ))}
        </ol>
        <span>
          <strong>{done}</strong> fakta lengkap{done < MIN ? `, butuh ${MIN - done} lagi` : ", siap lanjut!"}
        </span>
      </div>

      <ol className={styles.factList}>
        {facts.map((f, i) => {
          const opinion = OPINION.test(f.fact);
          const hasYear = YEAR.test(f.source);
          return (
            <li key={i} className={styles.factCard} data-done={isComplete(f) || undefined}>
              <div className={styles.factHead}>
                <span className={styles.factNum}>Fakta {i + 1}</span>
                {facts.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setFacts((list) => list.filter((_, k) => k !== i))}
                    aria-label={`Hapus fakta ${i + 1}`}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                )}
              </div>

              <label htmlFor={`fact-${i}`} className={styles.fieldLabel}>Fakta</label>
              <textarea
                id={`fact-${i}`}
                className={`${styles.input} ${styles.textarea}`}
                rows={2}
                value={f.fact}
                onChange={(e) => update(i, { fact: e.target.value })}
                placeholder={i === 0 ? "Contoh: 73% remaja Indonesia memakai gadget lebih dari 5 jam per hari." : "Ketik fakta di sini"}
              />
              {opinion && (
                <p className={styles.warn}>Kalimat ini terdengar seperti opini. Fakta sebaiknya bisa dibuktikan, bukan pendapat.</p>
              )}

              <label htmlFor={`src-${i}`} className={styles.fieldLabel}>Sumber <small>nama lembaga/orang + tahun</small></label>
              <input
                id={`src-${i}`}
                className={styles.input}
                value={f.source}
                onChange={(e) => update(i, { source: e.target.value })}
                placeholder="Contoh: Kementerian Kesehatan, 2024"
              />
              <div className={styles.sourceRow}>
                <div className={styles.sourceChips} role="group" aria-label={`Isi cepat sumber fakta ${i + 1}`}>
                  {SOURCES.map((s) => (
                    <button key={s} type="button" onClick={() => addSource(i, s)}>{s}</button>
                  ))}
                </div>
                {f.source.trim() && !hasYear && <span className={styles.sourceHint}>Tambahkan tahunnya</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" className={styles.addBtn} onClick={() => setFacts((list) => [...list, { fact: "", source: "" }])}>
        <Plus size={18} aria-hidden /> Tambah fakta
      </button>

      <p className={styles.tip}>
        <Lightbulb size={16} aria-hidden /> Sebut sumbernya di dalam kalimat nanti, misalnya &ldquo;Menurut BPS (2024), ...&rdquo;. Tidak perlu daftar pustaka.
      </p>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.footer}>
        <Link href={`/menulis/${article.id}/tahap/2`} className={styles.secondaryBtn}>Sebelumnya</Link>
        <button type="submit" className={styles.primaryBtn}>Simpan & lanjut</button>
      </div>
    </form>
  );
}
