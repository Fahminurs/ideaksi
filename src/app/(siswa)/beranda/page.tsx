"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, BookOpen, FileText, CircleHelp, PenLine } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { STAGES } from "@/lib/stages";
import { createArticle, useArticles } from "@/lib/articles";
import { useQuizBest } from "@/lib/quiz";
import { useReadCount } from "@/lib/materiProgress";
import styles from "./beranda.module.css";

const LEARN = [
  { href: "/materi", icon: BookOpen, title: "Materi", desc: "Struktur & teknik menulis", tone: "blue" },
  { href: "/contoh", icon: FileText, title: "Contoh artikel", desc: "Baca artikel yang sudah jadi", tone: "green" },
  { href: "/kuis", icon: CircleHelp, title: "Kuis", desc: "10 soal tentang struktur artikel", tone: "amber" },
];

const MATERI_TOTAL = 9; // jumlah bab di materi/content.tsx

export default function BerandaPage() {
  const user = useUser();
  const router = useRouter();
  const articles = useArticles() ?? [];
  const quizBest = useQuizBest();
  const materiRead = useReadCount();
  const active = articles.filter((a) => !a.doneAt);
  const current = active[0]; // terbaru diedit
  const article = current
    ? {
        id: current.id,
        stage: current.stage,
        title: current.draft?.title || current.topic?.text || "Artikel tanpa judul",
        updated: new Date(current.updated).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      }
    : null;
  const stats = { active: active.length, done: articles.length - active.length, quiz: quizBest ?? 0 };
  const stage = article?.stage ?? 0;
  const firstName = user?.name.split(" ")[0];

  return (
    <>
      <h1 className={styles.greet}>Halo{firstName && `, ${firstName}`}!</h1>
      <p className={styles.greetSub}>Ayo lanjutkan tulisanmu hari ini.</p>

      <section className={styles.hero} aria-labelledby="current-title">
        <span className={styles.chip}>{article ? `Tahap ${stage} dari ${STAGES.length}` : "Belum ada artikel aktif"}</span>
        <h2 id="current-title" className={styles.title}>{article?.title ?? "Yuk, mulai artikel pertamamu!"}</h2>

        <ol className={styles.tracker}>
          {STAGES.map(({ short, label }, i) => {
            const n = i + 1;
            const state = n < stage ? "done" : n === stage ? "active" : "locked";
            return (
              <li key={short} data-state={state} aria-current={state === "active" ? "step" : undefined}>
                <span className={styles.dot}>
                  {state === "done" ? <Check size={16} strokeWidth={3} aria-label="selesai" /> : n}
                </span>
                <span className={styles.stepLabel}>
                  <span className={styles.short}>{short}</span>
                  <span className={styles.long}>{label}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className={styles.heroFoot}>
          {article ? (
            <Link href={`/menulis/${article.id}/tahap/${stage}`} className={styles.resume}>Lanjutkan menulis</Link>
          ) : (
            <button type="button" className={styles.resume} onClick={() => router.push(`/menulis/${createArticle().id}/tahap/1`)}>
              Mulai menulis
            </button>
          )}
          {article && <span className={styles.updated}>Terakhir diedit {article.updated}</span>}
        </div>
      </section>

      <div className={styles.columns}>
        <section>
          <h3 className={styles.sectionTitle}>Belajar dulu</h3>
          <ul className={styles.learn}>
            {LEARN.map(({ href, icon: Icon, title, desc, tone }) => (
              <li key={href}>
                <Link href={href} className={styles.learnItem} data-tone={tone}>
                  <span className={styles.learnIcon}><Icon size={20} aria-hidden /></span>
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Capaianmu</h3>
          <ul className={styles.progress}>
            {[
              {
                tone: "blue", icon: PenLine, label: "Artikel", unit: "tahap", max: STAGES.length,
                value: article ? stage - 1 : stats.done ? STAGES.length : 0,
                note: `${stats.done} artikel selesai, ${stats.active} sedang ditulis`,
              },
              {
                tone: "green", icon: BookOpen, label: "Materi", unit: "bab", max: MATERI_TOTAL,
                value: materiRead ?? 0,
                note: materiRead ? "Bab yang sudah kamu buka" : "Belum ada bab yang dibaca",
              },
              {
                tone: "amber", icon: CircleHelp, label: "Kuis", unit: "poin", max: 100,
                value: stats.quiz,
                note: quizBest == null ? "Belum mengerjakan" : `Skor terbaik, ${stats.quiz / 10} dari 10 benar`,
              },
            ].map(({ tone, icon: Icon, label, unit, max, value, note }) => (
              <li key={label} data-tone={tone}>
                <span className={styles.progIcon} aria-hidden><Icon size={20} /></span>
                <div className={styles.progMain}>
                  <div className={styles.progHead}>
                    <strong>{label}</strong>
                    <span>{value}/{max} {unit}</span>
                  </div>
                  <div
                    className={styles.progTrack}
                    role="progressbar"
                    aria-label={label}
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                  >
                    {value > 0 && <div className={styles.progFill} style={{ width: `${(value / max) * 100}%` }} />}
                  </div>
                  <small>{note}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
