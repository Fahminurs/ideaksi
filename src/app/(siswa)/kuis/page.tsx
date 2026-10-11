"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheck, CircleX, Lightbulb, RotateCcw, Trophy, X } from "lucide-react";
import { stageVars } from "@/lib/stages";
import { QUIZ, QUIZ_TITLE, isCorrect, saveQuizScore } from "@/lib/quiz";
import styles from "./kuis.module.css";

const LETTERS = ["A", "B", "C", "D"];
// warna kartu berganti tiap soal (pakai 6 warna tahap)
const toneOf = (i: number) => stageVars((i % 6) + 1);

function message(score: number) {
  if (score === 100) return "Sempurna! Kamu benar-benar paham artikel ilmiah populer.";
  if (score >= 80) return "Bagus! Kamu sudah memahami struktur artikel ilmiah populer.";
  if (score >= 60) return "Lumayan! Baca lagi materinya, lalu coba kuis sekali lagi.";
  return "Tidak apa-apa, belajar itu bertahap. Yuk baca materinya dulu, lalu coba lagi.";
}

export default function KuisPage() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[][]>(() => QUIZ.map(() => []));
  const [checked, setChecked] = useState<boolean[]>(() => QUIZ.map(() => false));
  const [finished, setFinished] = useState(false);

  const q = QUIZ[index];
  const mine = picked[index];
  const done = checked[index];
  const correctCount = QUIZ.filter((qq, i) => checked[i] && isCorrect(qq, picked[i])).length;
  const score = correctCount * 10;

  const check = (i: number, value: number[]) => {
    setPicked((p) => p.map((x, k) => (k === i ? value : x)));
    setChecked((c) => c.map((x, k) => (k === i ? true : x)));
  };

  const pick = (opt: number) => {
    if (done) return;
    if (q.type === "multi") {
      setPicked((p) => p.map((x, k) => (k === index ? (x.includes(opt) ? x.filter((o) => o !== opt) : [...x, opt]) : x)));
    } else {
      check(index, [opt]); // pilihan tunggal & benar/salah langsung diperiksa
    }
  };

  const next = () => {
    if (index < QUIZ.length - 1) return setIndex(index + 1);
    saveQuizScore(score);
    setFinished(true);
  };

  const restart = () => {
    setPicked(QUIZ.map(() => []));
    setChecked(QUIZ.map(() => false));
    setIndex(0);
    setFinished(false);
  };

  const dots = (
    <ol className={styles.dots} aria-label="Progres soal">
      {QUIZ.map((qq, i) => {
        const state = checked[i] ? (isCorrect(qq, picked[i]) ? "right" : "wrong") : i === index && !finished ? "now" : "todo";
        return (
          <li key={i}>
            <button
              type="button"
              data-state={state}
              onClick={() => { setFinished(false); setIndex(i); }}
              aria-label={`Soal ${i + 1}${state === "right" ? ", benar" : state === "wrong" ? ", salah" : ""}`}
              aria-current={i === index && !finished ? "step" : undefined}
            >
              {state === "right" ? <Check size={12} strokeWidth={3.5} /> : state === "wrong" ? <X size={12} strokeWidth={3.5} /> : i + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );

  if (finished) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>{QUIZ_TITLE}</h1>
          {dots}
        </header>

        <section className={styles.result} aria-live="polite">
          <span className={styles.trophy} aria-hidden><Trophy size={36} /></span>
          <p className={styles.bigScore}>{score}<small>/100</small></p>
          <p className={styles.resultSub}>{correctCount} dari {QUIZ.length} benar</p>
          <p className={styles.resultMsg}>{message(score)}</p>
          <div className={styles.resultActions}>
            <button type="button" className={styles.primaryBtn} onClick={restart}>
              <RotateCcw size={18} aria-hidden /> Ulangi kuis
            </button>
            <Link href="/materi" className={styles.secondaryBtn}>Baca materi</Link>
          </div>
        </section>

        <h2 className={styles.reviewTitle}>Pembahasan</h2>
        <ol className={styles.review}>
          {QUIZ.map((qq, i) => {
            const ok = isCorrect(qq, picked[i]);
            return (
              <li key={i} style={toneOf(i)} data-ok={ok || undefined}>
                <span className={styles.reviewIcon} aria-hidden>{ok ? <CircleCheck size={22} /> : <CircleX size={22} />}</span>
                <div>
                  <p className={styles.reviewQ}>{i + 1}. {qq.question}</p>
                  <p className={styles.reviewA}>
                    Jawaban: <strong>{qq.answer.map((a) => (qq.type === "truefalse" ? qq.options[a] : LETTERS[a])).join(" dan ")}</strong>
                  </p>
                  <p className={styles.reviewExplain}>{qq.explain}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const ok = done && isCorrect(q, mine);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{QUIZ_TITLE}</h1>
        <p>{QUIZ.length} soal tentang artikel ilmiah populer. Pilih jawaban, lalu lihat pembahasannya.</p>
        {dots}
      </header>

      <section className={styles.card} style={toneOf(index)} aria-labelledby="q-text">
        <div className={styles.cardTop}>
          <span className={styles.qNum}>Soal {index + 1} dari {QUIZ.length}</span>
          {q.type === "multi" && <span className={styles.qHint}>Pilih semua yang benar</span>}
          {q.type === "truefalse" && <span className={styles.qHint}>Benar atau salah?</span>}
        </div>
        <h2 id="q-text" className={styles.question}>{q.question}</h2>

        <div className={q.type === "truefalse" ? styles.tfGrid : styles.options} role="group" aria-labelledby="q-text">
          {q.options.map((opt, i) => {
            const chosen = mine.includes(i);
            const state = done ? (q.answer.includes(i) ? "right" : chosen ? "wrong" : "idle") : chosen ? "chosen" : "idle";
            return (
              <button
                key={opt}
                type="button"
                className={styles.option}
                data-state={state}
                aria-pressed={chosen}
                disabled={done}
                onClick={() => pick(i)}
              >
                {q.type !== "truefalse" && <span className={styles.letter}>{LETTERS[i]}</span>}
                <span className={styles.optText}>{opt}</span>
                {done && q.answer.includes(i) && <CircleCheck size={22} className={styles.optMark} aria-hidden />}
                {done && chosen && !q.answer.includes(i) && <CircleX size={22} className={styles.optMark} aria-hidden />}
              </button>
            );
          })}
        </div>

        {done && (
          <div className={styles.feedback} data-ok={ok || undefined} role="status">
            <strong>{ok ? "Benar! Hebat." : "Belum tepat."}</strong>
            <p><Lightbulb size={16} aria-hidden /> {q.explain}</p>
          </div>
        )}
      </section>

      <div className={styles.nav}>
        <button type="button" className={styles.secondaryBtn} onClick={() => setIndex(index - 1)} disabled={index === 0}>
          Sebelumnya
        </button>
        {!done && q.type === "multi" ? (
          <button type="button" className={styles.primaryBtn} onClick={() => check(index, mine)} disabled={mine.length === 0}>
            Periksa jawaban
          </button>
        ) : (
          <button type="button" className={styles.primaryBtn} onClick={next} disabled={!done}>
            {index === QUIZ.length - 1 ? "Lihat hasil" : "Soal berikutnya"}
          </button>
        )}
      </div>
    </div>
  );
}
