"use client";

// Textarea yang tingginya mengikuti isi: tidak ada scroll di dalam kotak, cukup scroll halaman.
import { useEffect, useLayoutEffect, useRef } from "react";
import styles from "./tahap.module.css";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function AutoText({ className = "", ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(fit, [props.value]);

  // lebar berubah (putar HP / ubah ukuran jendela) => tinggi ikut berubah
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return <textarea {...props} ref={ref} rows={1} className={`${styles.autoText} ${className}`} />;
}
