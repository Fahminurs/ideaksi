// Potongan bersama tahap 4-5: ringkasan data artikel + status "Dea sedang bekerja".
import { Sparkles } from "lucide-react";
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
