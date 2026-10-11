"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { saveArticle, type Article } from "@/lib/articles";
import { generateOutline, type Outline } from "@/lib/ai";
import { stageVars } from "@/lib/stages";
import { DeaPanel } from "./AiParts";
import AutoText from "./AutoText";
import { FieldError, goTo } from "./FieldError";
import styles from "./tahap.module.css";

// warna bagian sama dengan anotasi di Contoh artikel
const PARTS: { key: keyof Outline; label: string; hint: string; stage: number }[] = [
  { key: "pendahuluan", label: "Pendahuluan", hint: "Memperkenalkan topik dan pertanyaan.", stage: 3 },
  { key: "isi", label: "Isi", hint: "Fakta dan penjelasan, satu poin per baris.", stage: 4 },
  { key: "penutup", label: "Penutup", hint: "Kesimpulan dan saran untuk pembaca.", stage: 1 },
];

export default function Step4Outline({ article }: { article: Article }) {
  const router = useRouter();
  const [outline, setOutline] = useState<Outline | undefined>(article.outline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); // error umum (dekat tombol Dea)
  const [empty, setEmpty] = useState<keyof Outline | null>(null); // bagian kerangka yang kosong
  const [made, setMade] = useState(0); // berapa kali Dea membuat kerangka di kunjungan ini

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      setOutline(await generateOutline(article));
      setMade((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dea gagal membuat kerangka. Coba lagi.");
    }
    setBusy(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outline) {
      setError("Buat kerangkanya dulu dengan bantuan Dea.");
      return goTo("dea-action");
    }
    const blank = PARTS.find((p) => !outline[p.key].trim());
    if (blank) {
      setEmpty(blank.key);
      return goTo(`o-${blank.key}`);
    }
    saveArticle({
      ...article,
      outline,
      gen: { outline: (article.gen?.outline ?? 0) + made, draft: article.gen?.draft ?? 0 },
      stage: Math.max(article.stage, 5),
    });
    router.push(`/menulis/${article.id}/tahap/5`);
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <DeaPanel
        lead="Dea menyusun kerangka dari topik, pertanyaan, dan fakta yang sudah kamu isi. Kamu bebas mengubahnya."
        rows={[
          { label: "Topik", value: article.topic?.text ?? "-", stage: 1 },
          { label: "Pertanyaan", value: article.question?.main ?? "-", stage: 2 },
          { label: "Fakta", value: `${article.facts?.length ?? 0} fakta + sumber`, stage: 3 },
        ]}
        busy={busy}
        workingText="Dea sedang menyusun kerangka"
        label="Buatkan kerangka"
        hasResult={Boolean(outline)}
        onGenerate={generate}
        error={error}
      />

      {outline && !busy && (
        <section className={styles.panel} aria-labelledby="outline-h">
        <h2 id="outline-h" className={styles.panelTitle}>Kerangka artikelmu</h2>
        <ol className={styles.outline}>
          {PARTS.map((p, i) => (
            <li key={p.key} style={stageVars(p.stage)}>
              <span className={styles.outlineNum} aria-hidden>{i + 1}</span>
              <div className={styles.outlineBody}>
                <label htmlFor={`o-${p.key}`} className={styles.outlineLabel}>{p.label}</label>
                <span className={styles.outlineHint}>{p.hint}</span>
                <AutoText
                  id={`o-${p.key}`}
                  className={styles.plainEdit}
                  value={outline[p.key]}
                  onChange={(e) => { setOutline({ ...outline, [p.key]: e.target.value }); setEmpty(null); }}
                />
                {empty === p.key && <FieldError>Bagian {p.label.toLowerCase()} tidak boleh kosong.</FieldError>}
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.tip}>
          <Lightbulb size={16} aria-hidden /> Kerangka itu seperti peta. Urutkan isi dari fakta yang paling penting.
        </p>
        </section>
      )}


      <div className={styles.footer}>
        <Link href={`/menulis/${article.id}/tahap/3`} className={styles.secondaryBtn}>Sebelumnya</Link>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>Simpan & lanjut</button>
      </div>
    </form>
  );
}
