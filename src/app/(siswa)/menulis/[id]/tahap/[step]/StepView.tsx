"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { STAGES, stageVars } from "@/lib/stages";
import { useArticle } from "@/lib/articles";
import StageGuide from "./StageGuide";
import Step1Topic from "./Step1Topic";
import Step2Question from "./Step2Question";
import Step3Facts from "./Step3Facts";
import Step4Outline from "./Step4Outline";
import Step5Draft from "./Step5Draft";
import Step6Revise from "./Step6Revise";
import styles from "./tahap.module.css";

export default function StepView() {
  const { id, step: stepParam } = useParams<{ id: string; step: string }>();
  const step = Number(stepParam);
  const article = useArticle(id);

  if (article === undefined) return null; // menunggu localStorage
  if (article === null || !(step >= 1 && step <= STAGES.length)) {
    return (
      <div className={styles.notice}>
        <p>Artikel atau tahap tidak ditemukan.</p>
        <Link href="/menulis" className={styles.noticeLink}>Kembali ke daftar artikel</Link>
      </div>
    );
  }

  const { label, icon: Icon } = STAGES[step - 1];

  return (
    <div className={styles.stagePage} style={stageVars(step)}>
      <div className={styles.topbar}>
        <Link href="/menulis" className={styles.back}>
          <ArrowLeft size={18} aria-hidden /> Artikel saya
        </Link>
        <span className={styles.counter}>Tahap {step} dari {STAGES.length}</span>
      </div>

      <ol className={styles.bar} aria-label="Tahap menulis">
        {STAGES.map((s, i) => {
          const n = i + 1;
          const state = n === step ? "current" : n <= article.stage ? "open" : "locked";
          return (
            <li key={s.short} data-state={state} style={stageVars(n)}>
              {state === "locked" ? (
                <span title={`${s.label} (terkunci)`}><span className={styles.srOnly}>{s.label}, terkunci</span></span>
              ) : (
                <Link href={`/menulis/${id}/tahap/${n}`} aria-current={state === "current" ? "step" : undefined} title={s.label}>
                  <span className={styles.srOnly}>{s.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <header className={styles.head}>
        <span className={styles.headIcon}><Icon size={24} aria-hidden /></span>
        <h1>{label}</h1>
      </header>

      {step <= article.stage && <StageGuide key={step} step={step} />}

      {step > article.stage ? (
        <div className={styles.notice}>
          <Lock size={28} aria-hidden />
          <p>Tahap ini masih terkunci. Selesaikan tahap sebelumnya dulu, ya.</p>
          <Link href={`/menulis/${id}/tahap/${article.stage}`} className={styles.noticeLink}>
            Buka Tahap {article.stage}
          </Link>
        </div>
      ) : step === 1 ? (
        <Step1Topic article={article} />
      ) : step === 2 ? (
        <Step2Question article={article} />
      ) : step === 3 ? (
        <Step3Facts article={article} />
      ) : step === 4 ? (
        <Step4Outline article={article} />
      ) : step === 5 ? (
        <Step5Draft article={article} />
      ) : (
        <Step6Revise article={article} />
      )}
    </div>
  );
}
