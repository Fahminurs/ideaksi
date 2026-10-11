// Potongan bersama tahap 4-5: panel "Bahan untuk Dea" (ringkasan + tombol AI) dan status "Dea sedang bekerja".
import { RefreshCw, Sparkles } from "lucide-react";
import { FieldError } from "./FieldError";
import { stageVars } from "@/lib/stages";
import styles from "./tahap.module.css";

export function Summary({ rows }: { rows: { label: string; value: string; stage: number }[] }) {
  return (
    <dl className={styles.summary}>
      {rows.map((r) => (
        <div key={r.label} style={stageVars(r.stage)}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DeaWorking({ text }: { text: string }) {
  return (
    <div className={styles.deaWorking} role="status">
      <span className={styles.deaOrb} aria-hidden><Sparkles size={22} /></span>
      <span>{text}</span>
      <span className={styles.deaDots} aria-hidden><i /><i /><i /></span>
    </div>
  );
}

// Panel utama tahap AI: bahan dari siswa di atas, tombol Dea di bawah, semua dalam satu kartu.
export function DeaPanel({
  lead, rows, busy, workingText, label, hasResult, onGenerate, error,
}: {
  lead: string;
  rows: { label: string; value: string; stage: number }[];
  busy: boolean;
  workingText: string;
  label: string;
  hasResult: boolean;
  onGenerate: () => void;
  error: string;
}) {
  return (
    <section className={styles.deaPanel} aria-label="Bahan untuk Dea">
      <header className={styles.deaPanelHead}>
        <span className={styles.deaFace} aria-hidden><Sparkles size={22} /></span>
        <div>
          <strong>Bahan untuk Dea</strong>
          <p>{lead}</p>
        </div>
      </header>
      <Summary rows={rows} />
      <div className={styles.deaPanelFoot}>
        {busy ? (
          <DeaWorking text={workingText} />
        ) : (
          <button type="button" id="dea-action" className={hasResult ? styles.regenBtn : styles.deaBtn} onClick={onGenerate}>
            {hasResult ? <RefreshCw size={18} aria-hidden /> : <Sparkles size={20} aria-hidden />}
            {hasResult ? "Buatkan ulang" : label}
          </button>
        )}
        <FieldError>{error}</FieldError>
      </div>
    </section>
  );
}
