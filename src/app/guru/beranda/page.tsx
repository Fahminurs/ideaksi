"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, CircleCheck, CirclePause, PenLine, Search, Trophy } from "lucide-react";
import { STAGES, stageVars } from "@/lib/stages";
import { CLASS_NAME, statusOf, stepsDone, type Student } from "@/lib/kelas";
import { useStudents } from "@/lib/useKelas";
import styles from "../dashboard.module.css";

const initials = (name: string) => name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const STATUS_LABEL = { selesai: "Selesai", aktif: "Menulis", belum: "Belum mulai" } as const;

const SORTS: Record<string, { label: string; fn: (a: Student, b: Student) => number }> = {
  nama: { label: "Nama A–Z", fn: (a, b) => a.name.localeCompare(b.name) },
  tahap: { label: "Tahap tertinggi", fn: (a, b) => b.stage - a.stage || a.name.localeCompare(b.name) },
  kuis: { label: "Skor kuis", fn: (a, b) => (b.quiz ?? -1) - (a.quiz ?? -1) },
};

export default function GuruBerandaPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("nama");
  const { data, error } = useStudents();
  const STUDENTS = useMemo(() => data ?? [], [data]);

  const list = useMemo(
    () =>
      STUDENTS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).sort(SORTS[sort].fn),
    [query, sort, STUDENTS],
  );

  const count = (st: string) => STUDENTS.filter((s) => statusOf(s) === st).length;
  const quizzed = STUDENTS.filter((s) => s.quiz != null);
  const avgQuiz = quizzed.length ? Math.round(quizzed.reduce((n, s) => n + s.quiz!, 0) / quizzed.length) : 0;
  const avgStage = STUDENTS.length ? (STUDENTS.reduce((n, s) => n + stepsDone(s), 0) / STUDENTS.length).toFixed(1) : "0";

  const summary = [
    { icon: BarChart3, label: "Rata-rata tahap", value: avgStage, unit: "/6", tone: 4 },
    { icon: CircleCheck, label: "Selesai", value: count("selesai"), unit: "siswa", tone: 3 },
    { icon: PenLine, label: "Sedang menulis", value: count("aktif"), unit: "siswa", tone: 1 },
    { icon: CirclePause, label: "Belum mulai", value: count("belum"), unit: "siswa", tone: 5 },
    { icon: Trophy, label: "Rata-rata kuis", value: avgQuiz, unit: "/100", tone: 2 },
  ];

  return (
    <>
      <header className={styles.head}>
        <h1>Dashboard guru</h1>
        <p>{CLASS_NAME} · {data ? `${STUDENTS.length} siswa` : error ? "" : "memuat..."}</p>
      </header>
      {error && <p className={styles.loadError} role="alert">{error}</p>}

      <ul className={styles.summary}>
        {summary.map(({ icon: Icon, label, value, unit, tone }) => (
          <li key={label} style={stageVars(tone)}>
            <span className={styles.sumIcon} aria-hidden><Icon size={20} /></span>
            <strong>{value}<small>{unit}</small></strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <section className={styles.card} aria-labelledby="dist-h">
        <h2 id="dist-h">Sudah sampai tahap</h2>
        <ul className={styles.dist}>
          {STAGES.map(({ label, icon: Icon }, i) => {
            const n = STUDENTS.filter((s) => s.stage >= i + 1).length;
            return (
              <li key={label} style={stageVars(i + 1)}>
                <span className={styles.distLabel}><Icon size={16} aria-hidden /> {i + 1}. {label}</span>
                <div className={styles.track} role="img" aria-label={`${n} dari ${STUDENTS.length} siswa`}>
                  {n > 0 && <div className={styles.fill} style={{ width: `${(n / Math.max(1, STUDENTS.length)) * 100}%` }} />}
                </div>
                <span className={styles.distNum}>{n}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="students-h">
        <div className={styles.listHead}>
          <h2 id="students-h">Progres siswa</h2>
          <div className={styles.tools}>
            <label className={styles.search}>
              <Search size={18} aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama siswa" aria-label="Cari nama siswa" />
            </label>
            <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan">
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {data && list.length === 0 && (
          <p className={styles.empty}>{query ? <>Tidak ada siswa bernama &ldquo;{query}&rdquo;.</> : "Belum ada siswa terdaftar."}</p>
        )}
        <ol className={styles.students}>
          {list.map((s, i) => {
            const status = statusOf(s);
            const done = stepsDone(s);
            const tone = status === "selesai" ? 3 : status === "belum" ? 5 : Math.min(s.stage, 6);
            return (
              <li key={s.id} style={stageVars(tone)}>
                <Link href={`/guru/siswa/${s.id}`} className={styles.student}>
                  <span className={styles.no} aria-label={`Nomor ${i + 1}`}>{i + 1}</span>
                  <span className={styles.avatar} aria-hidden>{initials(s.name)}</span>
                  <span className={styles.who}>
                    <strong>{s.name}</strong>
                    <small>
                      {status === "aktif" ? `Tahap ${s.stage}: ${STAGES[s.stage - 1].label}` : STATUS_LABEL[status]}
                      {s.quiz != null && ` · Kuis ${s.quiz}`}
                    </small>
                  </span>
                  <span className={styles.studentBar}>
                    <span className={styles.track}>
                      {done > 0 && <span className={styles.fill} style={{ width: `${(done / 6) * 100}%` }} />}
                    </span>
                    <span className={styles.steps}>{done}/6</span>
                  </span>
                  <span className={styles.status} data-status={status}>{STATUS_LABEL[status]}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
