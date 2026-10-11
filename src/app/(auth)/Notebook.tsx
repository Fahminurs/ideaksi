"use client";

import { useEffect, useState } from "react";
import styles from "./auth.module.css";

const QUESTIONS = [
  "Kenapa langit berwarna biru?",
  "Benarkah gadget bikin susah tidur?",
  "Ke mana perginya sampah plastik kita?",
  "Bisakah AI menggantikan guru?",
];

// Mengetik pertanyaan satu per satu, lalu menghapusnya.
function useTypewriter(lines: string[]) {
  const [text, setText] = useState(lines[0]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let line = 0;
    let len = lines[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = lines[line];
      len += deleting ? -1 : 1;
      setText(full.slice(0, len));
      let wait = deleting ? 28 : 55;
      if (!deleting && len === full.length) {
        deleting = true;
        wait = 2200;
      } else if (deleting && len === 0) {
        deleting = false;
        line = (line + 1) % lines.length;
        wait = 350;
      }
      timer = setTimeout(tick, wait);
    };

    timer = setTimeout(tick, 2200);
    return () => clearTimeout(timer);
  }, [lines]);

  return text;
}

export default function Notebook() {
  const question = useTypewriter(QUESTIONS);

  return (
    <section className={styles.notebook}>
      <h1 className={styles.question} aria-label="Tulisan hebat berawal dari rasa penasaran">
        <span aria-hidden>{question}</span>
        <span className={styles.caret} aria-hidden />
      </h1>
      <p className={styles.note}>Tulisan hebat berawal dari rasa penasaran.</p>
    </section>
  );
}
