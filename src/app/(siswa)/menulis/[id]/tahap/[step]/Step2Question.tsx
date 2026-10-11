"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Lightbulb, Plus, X } from "lucide-react";
import { saveArticle, type Article } from "@/lib/articles";
import styles from "./tahap.module.css";

const STARTERS = ["Bagaimana", "Mengapa", "Apa dampak", "Seberapa besar"];
const QUESTION_WORDS = /^(bagaimana|mengapa|kenapa|apa|apakah|seberapa|siapa|kapan|di mana|berapa)\b/i;
const MAX_SUBS = 3;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
// kata penting (>= 4 huruf) dari topik, untuk cek "berkaitan dengan topik"
const keywords = (s: string) => words(s.toLowerCase().replace(/[^a-z0-9\s]/g, "")).filter((w) => w.length >= 4);

export default function Step2Question({ article }: { article: Article }) {
  const router = useRouter();
  const topic = article.topic?.text ?? "";
  const [main, setMain] = useState(article.question?.main ?? "");
  const [subs, setSubs] = useState<string[]>(article.question?.subs?.length ? article.question.subs : [""]);
  const [error, setError] = useState("");

  const q = main.trim();
  const topicWords = keywords(topic);
  const checks = [
    { label: "Diawali kata tanya", ok: QUESTION_WORDS.test(q), required: true },
    { label: "Diakhiri tanda tanya (?)", ok: q.endsWith("?"), required: true },
    { label: "Cukup jelas (minimal 6 kata)", ok: words(q).length >= 6, required: true },
    {
      label: "Berkaitan dengan topikmu",
      ok: topicWords.length === 0 || keywords(q).some((w) => topicWords.includes(w)),
      required: false,
    },
  ];
  const passed = checks.filter((c) => c.ok).length;

  const applyStarter = (s: string) => {
    const rest = main.replace(QUESTION_WORDS, "").trimStart();
    setMain(`${s} ${rest}`.trimEnd() + (rest ? "" : " "));
    setError("");
  };

  const setSub = (i: number, v: string) => setSubs((list) => list.map((x, k) => (k === i ? v : x)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checks.some((c) => c.required && !c.ok)) {
      return setError("Lengkapi dulu pertanyaan utamamu sampai tanda wajib menyala hijau.");
    }
    saveArticle({
      ...article,
      question: { main: q, subs: subs.map((s) => s.trim()).filter(Boolean) },
      stage: Math.max(article.stage, 3),
    });
    router.push(`/menulis/${article.id}/tahap/3`);
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <p className={styles.lead}>Tulis satu pertanyaan utama yang akan dijawab artikelmu.</p>

      <div className={styles.topicCard}>
        <span className={styles.topicLabel}>Topikmu</span>
        <strong>{topic || "Belum memilih topik"}</strong>
        <Link href={`/menulis/${article.id}/tahap/1`} className={styles.topicEdit}>Ubah</Link>
      </div>

      <div className={styles.card}>
        <label htmlFor="main-q" className={styles.cardTitle}>Pertanyaan utama</label>

        <div className={styles.starters} role="group" aria-label="Awali dengan">
          {STARTERS.map((s) => (
            <button key={s} type="button" className={styles.starter} onClick={() => applyStarter(s)}>
              {s}...
            </button>
          ))}
        </div>

        <textarea
          id="main-q"
          className={`${styles.input} ${styles.textarea}`}
          rows={3}
          value={main}
          onChange={(e) => { setMain(e.target.value); setError(""); }}
          placeholder="Contoh: Bagaimana penggunaan gadget berlebihan memengaruhi kesehatan remaja?"
        />

        <ul className={styles.checks} aria-label={`Pengecek pertanyaan: ${passed} dari ${checks.length} terpenuhi`}>
          {checks.map((c) => (
            <li key={c.label} data-ok={c.ok || undefined}>
              <span className={styles.checkDot} aria-hidden>{c.ok && <Check size={13} strokeWidth={3.5} />}</span>
              {c.label}
              {!c.required && <small>(saran)</small>}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>
          Sub-pertanyaan <small className={styles.optional}>opsional, maks. {MAX_SUBS}</small>
        </p>
        <p className={styles.tip}>
          <Lightbulb size={16} aria-hidden /> Sub-pertanyaan membantu memecah pertanyaan utama jadi bagian kecil yang lebih mudah dicari faktanya.
        </p>
        <ol className={styles.subs}>
          {subs.map((s, i) => (
            <li key={i}>
              <span className={styles.subNum} aria-hidden>{i + 1}</span>
              <input
                className={styles.input}
                value={s}
                onChange={(e) => setSub(i, e.target.value)}
                placeholder={i === 0 ? "Contoh: Berapa lama remaja memakai gadget setiap hari?" : "Sub-pertanyaan lain"}
                aria-label={`Sub-pertanyaan ${i + 1}`}
              />
              {subs.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setSubs((list) => list.filter((_, k) => k !== i))}
                  aria-label={`Hapus sub-pertanyaan ${i + 1}`}
                >
                  <X size={18} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ol>
        {subs.length < MAX_SUBS && (
          <button type="button" className={styles.addBtn} onClick={() => setSubs((list) => [...list, ""])}>
            <Plus size={18} aria-hidden /> Tambah sub-pertanyaan
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.footer}>
        <Link href={`/menulis/${article.id}/tahap/1`} className={styles.secondaryBtn}>Sebelumnya</Link>
        <button type="submit" className={styles.primaryBtn}>Simpan & lanjut</button>
      </div>
    </form>
  );
}
