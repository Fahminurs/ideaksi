"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpenText, Clock, RefreshCw, Sparkles } from "lucide-react";
import { saveArticle, type Article } from "@/lib/articles";
import { countWords, generateDraft, partOf, readMinutes, type Draft } from "@/lib/ai";
import { stageVars } from "@/lib/stages";
import { DeaWorking, Summary } from "./AiParts";
import { FieldError, goTo } from "./FieldError";
import styles from "./tahap.module.css";

export default function Step5Draft({ article }: { article: Article }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | undefined>(article.draft);
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); // error umum (dekat tombol Dea)
  const [titleError, setTitleError] = useState(false);
  const [made, setMade] = useState(0); // berapa kali Dea membuat draft di kunjungan ini

  const generate = async () => {
    setBusy(true);
    setError("");
    const next = variant + (draft ? 1 : 0);
    try {
      setDraft(await generateDraft(article, next));
      setVariant(next);
      setMade((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dea gagal membuat draft. Coba lagi.");
    }
    setBusy(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) {
      setError("Minta Dea membuat draft dulu.");
      return goTo("dea-action");
    }
    if (!draft.title.trim()) {
      setTitleError(true);
      return goTo("title");
    }
    const changed = article.draft?.body !== draft.body || article.draft?.title !== draft.title;
    saveArticle({
      ...article,
      draft,
      gen: { outline: article.gen?.outline ?? 0, draft: (article.gen?.draft ?? 0) + made },
      // draft baru = revisi dimulai ulang dari draft itu
      revision: changed ? undefined : article.revision,
      stage: Math.max(article.stage, 6),
    });
    router.push(`/menulis/${article.id}/tahap/6`);
  };

  const paragraphs = draft?.body.split(/\n{2,}/) ?? [];

  return (
    <form onSubmit={submit} className={styles.form}>
      <p className={styles.lead}>Dea menulis judul dan draft lengkap dari kerangkamu. Sumber disebut langsung di dalam kalimat.</p>

      <Summary
        rows={[
          { label: "Topik", value: article.topic?.text ?? "-", stage: 1 },
          { label: "Kerangka", value: article.outline ? "Pendahuluan, isi, penutup" : "Belum ada", stage: 4 },
          { label: "Fakta", value: `${article.facts?.length ?? 0} fakta + sumber`, stage: 3 },
        ]}
      />

      {busy ? (
        <DeaWorking text="Dea sedang menulis draft" />
      ) : (
        <button type="button" id="dea-action" className={draft ? styles.regenBtn : styles.deaBtn} onClick={generate}>
          {draft ? <RefreshCw size={18} aria-hidden /> : <Sparkles size={20} aria-hidden />}
          {draft ? "Buatkan ulang" : "Buatkan draft"}
        </button>
      )}
      <FieldError>{error}</FieldError>

      {draft && !busy && (
        <>
          <div className={styles.titleCard}>
            <label htmlFor="title">Judul dari Dea <small>boleh kamu ubah</small></label>
            <input
              id="title"
              className={styles.titleInput}
              value={draft.title}
              onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setTitleError(false); }}
            />
            {titleError && <FieldError>Judul tidak boleh kosong.</FieldError>}
          </div>

          <article className={styles.paper} aria-label="Draft artikel">
            {paragraphs.map((p, i) => {
              const part = partOf(i, paragraphs.length);
              const showLabel = i === 0 || part.label !== partOf(i - 1, paragraphs.length).label;
              return (
                <div key={i} className={styles.paperPart} style={stageVars(part.stage)}>
                  {showLabel && <span className={styles.partTag}>{part.label}</span>}
                  <p>{p}</p>
                </div>
              );
            })}
            <footer className={styles.stats}>
              <span><BookOpenText size={16} aria-hidden /> {countWords(draft.body)} kata</span>
              <span><Clock size={16} aria-hidden /> ±{readMinutes(draft.body)} menit baca</span>
            </footer>
          </article>
        </>
      )}


      <div className={styles.footer}>
        <Link href={`/menulis/${article.id}/tahap/4`} className={styles.secondaryBtn}>Sebelumnya</Link>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>Simpan & lanjut</button>
      </div>
    </form>
  );
}
