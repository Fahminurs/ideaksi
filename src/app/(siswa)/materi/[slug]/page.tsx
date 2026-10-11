import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { stageVars } from "@/lib/stages";
import { MATERI, type Materi } from "../content";
import styles from "../materi.module.css";
import contoh from "../../contoh/contoh.module.css";
import MarkRead from "./MarkRead";

const letter = (i: number) => String.fromCharCode(65 + i);

function PagerLink({ m, i, label, isNext = false }: { m: Materi; i: number; label: string; isNext?: boolean }) {
  const Icon = m.icon;
  return (
    <Link
      href={`/materi/${m.slug}`}
      className={`${contoh.pagerLink} ${isNext ? contoh.pagerNext : ""}`}
      style={stageVars(m.stage)}
    >
      <span className={contoh.pagerIcon} aria-hidden><Icon size={22} /></span>
      <span className={contoh.pagerText}>
        <small>{label}, Bab {letter(i)}</small>
        {m.title}
      </span>
    </Link>
  );
}

export function generateStaticParams() {
  return MATERI.map((m) => ({ slug: m.slug }));
}

async function MateriDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = MATERI.findIndex((m) => m.slug === slug);
  if (index === -1) notFound();

  const m = MATERI[index];
  const Icon = m.icon;
  const prev = MATERI[index - 1];
  const next = MATERI[index + 1];

  return (
    <div className={contoh.page} style={stageVars(m.stage)}>
      <MarkRead slug={m.slug} />
      <Link href="/materi" className={contoh.back}>
        <ArrowLeft size={18} aria-hidden /> Semua materi
      </Link>

      <header className={styles.chapterHead}>
        <span className={contoh.cardIcon} aria-hidden><Icon size={26} /></span>
        <div>
          <span className={contoh.chip}>Bab {letter(index)} dari {MATERI.length}</span>
          <h1>{m.title}</h1>
          <p>{m.minutes} menit baca</p>
        </div>
      </header>

      <article className={`${styles.article} ${styles.chapter}`}>
        <section className={styles.section}>{m.content}</section>
      </article>

      <nav className={contoh.pager} aria-label="Materi lainnya">
        {prev ? <PagerLink m={prev} i={index - 1} label="Sebelumnya" /> : <span />}
        {next && <PagerLink m={next} i={index + 1} label="Berikutnya" isNext />}
      </nav>
    </div>
  );
}

// params dibaca di dalam <Suspense> supaya navigasi tetap instan (Next 16).
export default function MateriDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <MateriDetail params={params} />
    </Suspense>
  );
}
