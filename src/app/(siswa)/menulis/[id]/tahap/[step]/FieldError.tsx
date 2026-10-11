// Pesan error tepat di bawah isian yang bermasalah, plus helper untuk menggulir ke sana.
import { CircleAlert } from "lucide-react";
import styles from "./tahap.module.css";

export function FieldError({ children, id }: { children: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p className={styles.fieldError} role="alert" id={id}>
      <CircleAlert size={16} aria-hidden /> {children}
    </p>
  );
}

// Gulir ke elemen ber-id lalu fokuskan (kalau bisa difokus)
export function goTo(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
}
