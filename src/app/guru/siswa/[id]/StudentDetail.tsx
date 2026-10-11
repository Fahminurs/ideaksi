"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Clock, Lock, Trophy } from "lucide-react";
import { STAGES, stageVars } from "@/lib/stages";
import { CLASS_NAME, MATERI_TOTAL, statusOf, stepsDone, type Student } from "@/lib/kelas";
import { useStudent } from "@/lib/useKelas";
import FinalArticle from "./FinalArticle";
import styles from "../../dashboard.module.css";

const initials = (name: string) => name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

// isi ringkas tiap tahap untuk timeline
function stageNote(s: Student, n: number): string {
  const a = s.article;
  if (!a) return "";
  switch (n) {
    case 1: return `Topik: ${a.topic}`;
    case 2: return a.question ? `Pertanyaan: “${a.question}”` : "Sedang merumuskan pertanyaan";
    case 3: return `${a.facts} fakta + sumber dikumpulkan`;
    case 4: return a.outlineGenerated ? `Kerangka dibuat Dea (${a.outlineGenerated}x)` : "Sedang menyusun kerangka";
    case 5: return a.draftGenerated ? `Draft + judul dibuat Dea (${a.draftGenerated}x)` : "Sedang membuat draft";
    default:
      if (s.stage === 7) return `Artikel final ${a.words} kata${a.revisions ? ` · direvisi ${a.revisions}x` : ""}`;
      return a.revisions ? `Revisi ${a.revisions}x · ${a.words} kata` : "Sedang merevisi";
  }
}

export default function StudentDetail({ id }: { id: string }) {
  const { data: s, error } = useStudent(id);
  if (error || s === null) {
    return (
      <div className={styles.detail}>
        <Link href="/guru/beranda" className={styles.back}><ArrowLeft size={18} aria-hidden /> Daftar siswa</Link>
        <p className={styles.empty}>{error ?? "Siswa tidak ditemukan."}</p>
      </div>
    );
  }
  if (!s) return <p className={styles.empty}>Memuat data siswa...</p>;

  const status = statusOf(s);
  const done = stepsDone(s);
  const tone = status === "selesai" ? 3 : status === "belum" ? 5 : Math.min(s.stage, 6);

  return (
    <div className={styles.detail}>
      <Link href="/guru/beranda" className={styles.back}>
        <ArrowLeft size={18} aria-hidden /> Daftar siswa
      </Link>

      <section className={styles.profile} style={stageVars(tone)}>
        <span className={`${styles.avatar} ${styles.avatarLg}`} aria-hidden>{initials(s.name)}</span>
        <div className={styles.profileMain}>
          <h1>{s.name}</h1>
          <p>{CLASS_NAME} · Terakhir aktif {date(s.updated)}</p>
          <div className={styles.studentBar}>
            <span className={styles.track}>
              {done > 0 && <span className={styles.fill} style={{ width: `${(done / 6) * 100}%` }} />}
            </span>
            <span className={styles.steps}>{done}/6 tahap</span>
          </div>
        </div>
      </section>

      <ul className={styles.summary}>
        <li style={stageVars(2)}>
          <span className={styles.sumIcon} aria-hidden><Trophy size={20} /></span>
          <strong>{s.quiz ?? "-"}<small>/100</small></strong>
          <span>{s.quiz == null ? "Belum mengerjakan kuis" : `Kuis, ${s.quiz / 10} dari 10 benar`}</span>
        </li>
        <li style={stageVars(3)}>
          <span className={styles.sumIcon} aria-hidden><BookOpen size={20} /></span>
          <strong>{s.materi}<small>/{MATERI_TOTAL}</small></strong>
          <span>Bab materi dibaca</span>
        </li>
      </ul>

      <section className={styles.card} aria-labelledby="art-h">
        <h2 id="art-h">Riwayat artikel</h2>
        {!s.article ? (
          <p className={styles.empty}>
            {status === "belum" ? "Siswa ini belum mulai menulis." : "Siswa ini masih memilih topik."}
          </p>
        ) : (
          <>
            <p className={styles.artTitle}>{s.article.title || s.article.topic}</p>
            <ol className={styles.timeline}>
              {STAGES.map(({ label, icon: Icon }, i) => {
                const n = i + 1;
                const state = s.stage > n ? "done" : s.stage === n ? "now" : "todo";
                return (
                  <li key={label} data-state={state} style={stageVars(n)}>
                    <span className={styles.tlDot} aria-hidden>
                      {state === "done" ? <Check size={16} strokeWidth={3} /> : state === "now" ? <Icon size={16} /> : <Lock size={14} />}
                    </span>
                    <div>
                      <strong>Tahap {n}: {label}</strong>
                      {state !== "todo" && <small>{stageNote(s, n)}</small>}
                      {state === "now" && <span className={styles.nowTag}><Clock size={12} aria-hidden /> Sedang dikerjakan</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {status === "selesai" &&
              (s.article.body ? (
                <FinalArticle title={s.article.title} author={s.name} body={s.article.body} />
              ) : (
                <p className={styles.empty}>Teks artikel final belum tersedia.</p>
              ))}
          </>
        )}
      </section>
    </div>
  );
}

