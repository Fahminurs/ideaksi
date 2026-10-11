import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import styles from "./contoh/contoh.module.css";

// Hanya tampil di HP: bottom nav tidak punya slot untuk Contoh artikel.
export default function BelajarTabs({ current }: { current: "materi" | "contoh" }) {
  return (
    <nav className={styles.belajarTabs} aria-label="Bahan belajar">
      <Link href="/materi" aria-current={current === "materi" ? "page" : undefined}>
        <BookOpen size={18} aria-hidden /> Materi
      </Link>
      <Link href="/contoh" aria-current={current === "contoh" ? "page" : undefined}>
        <FileText size={18} aria-hidden /> Contoh artikel
      </Link>
    </nav>
  );
}
