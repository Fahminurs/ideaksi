"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { saveArticle, type Article } from "@/lib/articles";
import { CATEGORIES } from "@/lib/topics";
import styles from "./tahap.module.css";

const MIN_WORDS = 3;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export default function Step1Topic({ article }: { article: Article }) {
  const router = useRouter();
  const saved = article.topic;
  const savedIsSuggestion = CATEGORIES.some((c) => c.topics.includes(saved?.text ?? ""));

  const [category, setCategory] = useState(saved?.category ?? CATEGORIES[0].id);
  const [picked, setPicked] = useState(savedIsSuggestion ? saved!.text : "");
  const [custom, setCustom] = useState(savedIsSuggestion ? "" : saved?.text ?? "");
  const [error, setError] = useState("");

  const cat = CATEGORIES.find((c) => c.id === category)!;
  const topic = custom.trim() || picked;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return setError("Pilih salah satu saran topik atau tulis topikmu sendiri.");
    if (custom.trim() && countWords(custom) < MIN_WORDS)
      return setError(`Topik yang kamu tulis minimal ${MIN_WORDS} kata supaya jelas.`);
    saveArticle({ ...article, topic: { category, text: topic }, stage: Math.max(article.stage, 2) });
    router.push(`/menulis/${article.id}/tahap/2`);
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <p className={styles.lead}>Pilih kategori, lalu ambil saran topik atau tulis topikmu sendiri.</p>

      <fieldset className={styles.card}>
        <legend className={styles.cardTitle}>Kategori</legend>
        <div className={styles.chips}>
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <label key={id} className={styles.chip}>
              <input
                type="radio"
                name="category"
                value={id}
                checked={category === id}
                onChange={() => { setCategory(id); setPicked(""); setError(""); }}
              />
              <Icon size={18} aria-hidden /> {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.card}>
        <legend className={styles.cardTitle}>Saran topik {cat.label.toLowerCase()}</legend>
        <div className={styles.options}>
          {cat.topics.map((t) => (
            <label key={t} className={styles.option}>
              <input
                type="radio"
                name="topic"
                value={t}
                checked={!custom.trim() && picked === t}
                onChange={() => { setPicked(t); setCustom(""); setError(""); }}
              />
              <span className={styles.optionMark} aria-hidden><Check size={14} strokeWidth={3} /></span>
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.card}>
        <label htmlFor="custom-topic" className={styles.cardTitle}>Atau tulis topikmu sendiri</label>
        <input
          id="custom-topic"
          className={styles.input}
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setError(""); }}
          placeholder="Contoh: Manfaat sarapan bagi konsentrasi belajar"
          aria-describedby="custom-hint"
        />
        <p id="custom-hint" className={styles.hint}>
          Minimal {MIN_WORDS} kata. {custom.trim() && `(${countWords(custom)} kata)`}
        </p>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.footer}>
        {topic && <p className={styles.chosen}>Topikmu: <strong>{topic}</strong></p>}
        <button type="submit" className={styles.primaryBtn}>Simpan & lanjut</button>
      </div>
    </form>
  );
}
