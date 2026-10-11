import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { CATEGORIES } from "@/lib/topics";
import { stageVars } from "@/lib/stages";
import { EXAMPLES, PARTS, readMinutes, wordCount, type Example } from "@/lib/examples";
import styles from "../contoh.module.css";

const CATEGORY_STAGE: Record<string, number> = { lingkungan: 3, kesehatan: 5, teknologi: 4 };

function PagerLink({ example, label, isNext = false }: { example: Example; label: string; isNext?: boolean }) {
  const cat = CATEGORIES.find((c) => c.id === example.category)!;
  const Icon = cat.icon;
  return (
    <Link
      href={`/contoh/${example.slug}`}
      className={`${styles.pagerLink} ${isNext ? styles.pagerNext : ""}`}
      style={stageVars(CATEGORY_STAGE[example.category])}
    >
      <span className={styles.pagerIcon} aria-hidden><Icon size={22} /></span>
      <span className={styles.pagerText}>
        <small>{label}, {cat.label}</small>
        {example.title}
      </span>
    </Link>
  );
}

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

async function ContohDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = EXAMPLES.findIndex((e) => e.slug === slug);
  if (index === -1) notFound();

  const e = EXAMPLES[index];
  const cat = CATEGORIES.find((c) => c.id === e.category)!;
  const prev = EXAMPLES[index - 1];
  const next = EXAMPLES[index + 1];
  let para = 0; // nomor paragraf berlanjut lintas bagian

  return (
    <div className={styles.page} style={stageVars(CATEGORY_STAGE[e.category])}>
      <Link href="/contoh" className={styles.back}>
        <ArrowLeft size={18} aria-hidden /> Contoh artikel
      </Link>

      <header className={styles.detailHead}>
        <span className={styles.chip}>{cat.label}</span>
        <h1>{e.title}</h1>
        <p>{readMinutes(e)} menit baca, ±{wordCount(e)} kata</p>
      </header>

      {/* Sakelar catatan: CSS saja (:has), tanpa JavaScript */}
      <div className={styles.tools}>
        <ul className={styles.legend} aria-label="Arti warna">
          {Object.values(PARTS).map((p) => (
            <li key={p.label} style={stageVars(p.stage)}>{p.label}</li>
          ))}
        </ul>
        <label className={styles.switch}>
          <input type="checkbox" defaultChecked className={styles.switchInput} />
          <span className={styles.switchTrack} aria-hidden />
          Tampilkan catatan
        </label>
      </div>

      <article className={styles.article}>
        {e.sections.map((s) => {
          const part = PARTS[s.part];
          return (
            <section key={s.part} className={styles.part} data-part={s.part} style={stageVars(part.stage)}>
              <span className={styles.partLabel}>{part.label}</span>
              {s.part === "judul" ? (
                <p className={styles.articleTitle}>{s.paragraphs[0]}</p>
              ) : (
                s.paragraphs.map((t) => {
                  para += 1;
                  return (
                    <p key={para} className={styles.para} data-n={para}>{t}</p>
                  );
                })
              )}
              <p className={styles.note}>
                <Lightbulb size={16} aria-hidden />
                <span><strong>Kenapa bagus?</strong> {s.note}</span>
              </p>
            </section>
          );
        })}
      </article>

      <p className={styles.disclaimer}>
        Contoh ini dibuat untuk latihan. Jika ingin diterbitkan, periksa lagi data dan sumbernya.
      </p>

      <nav className={styles.pager} aria-label="Contoh lainnya">
        {prev ? <PagerLink example={prev} label="Sebelumnya" /> : <span />}
        {next && <PagerLink example={next} label="Berikutnya" isNext />}
      </nav>
    </div>
  );
}

// params dibaca di dalam <Suspense> supaya navigasi tetap instan (Next 16).
export default function ContohDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <ContohDetail params={params} />
    </Suspense>
  );
}
