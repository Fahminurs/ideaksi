import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { stageVars } from "@/lib/stages";
import { MATERI } from "../content";
import ChapterNav from "./ChapterNav";
import styles from "../materi.module.css";
import contoh from "../../contoh/contoh.module.css";

const letter = (i: number) => String.fromCharCode(65 + i);
const totalMinutes = MATERI.reduce((n, m) => n + m.minutes, 0);

// Semua bab dalam satu halaman, tinggal di-scroll.
export default function MateriSemuaPage() {
  return (
    <div className={contoh.page}>
      <Link href="/materi" className={contoh.back}>
        <ArrowLeft size={18} aria-hidden /> Pilih per bab
      </Link>

      <header className={contoh.header}>
        <h1>Semua materi</h1>
        <p>{MATERI.length} bab, sekitar {totalMinutes} menit baca. Scroll untuk membaca dari awal sampai akhir.</p>
      </header>

      <ChapterNav items={MATERI.map((m) => ({ slug: m.slug, title: m.title, stage: m.stage }))} />

      <div className={styles.allChapters}>
        {MATERI.map((m, i) => {
          const Icon = m.icon;
          return (
            <section key={m.slug} id={m.slug} className={styles.chapterBlock} style={stageVars(m.stage)} aria-labelledby={`${m.slug}-h`}>
              <header className={styles.chapterHead}>
                <span className={contoh.cardIcon} aria-hidden><Icon size={26} /></span>
                <div>
                  <span className={contoh.chip}>Bab {letter(i)}</span>
                  <h2 id={`${m.slug}-h`}>{m.title}</h2>
                </div>
              </header>
              <article className={`${styles.article} ${styles.chapter}`}>
                <div className={styles.section}>{m.content}</div>
              </article>
            </section>
          );
        })}
      </div>
    </div>
  );
}
