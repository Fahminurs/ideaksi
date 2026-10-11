import Link from "next/link";
import BelajarTabs from "../BelajarTabs";
import { BookOpenText } from "lucide-react";
import { stageVars } from "@/lib/stages";
import { MATERI } from "./content";
import contoh from "../contoh/contoh.module.css";
import styles from "./materi.module.css";

export default function MateriPage() {
  return (
    <div className={contoh.page}>
      <BelajarTabs current="materi" />
      <header className={contoh.header}>
        <h1>Materi artikel ilmiah populer</h1>
        <p>Pelajari satu per satu, dari pengertian sampai cara menganalisis artikel. Pilih bab, atau baca semuanya sekaligus.</p>
      </header>

      <Link href="/materi/semua" className={styles.readAll}>
        <span className={styles.readAllIcon} aria-hidden><BookOpenText size={26} /></span>
        <span>
          <strong>Baca semua materi</strong>
          <small>{MATERI.length} bab dalam satu halaman, tinggal scroll</small>
        </span>
      </Link>

      <ul className={contoh.gallery}>
        {MATERI.map((m, i) => {
          const Icon = m.icon;
          return (
            <li key={m.slug} style={stageVars(m.stage)}>
              <Link href={`/materi/${m.slug}`} className={contoh.card}>
                <img className={contoh.cardArt} src={`/ilustrasi/${m.slug}.svg`} alt="" width={500} height={500} loading="lazy" />
                <span className={contoh.cardIcon} aria-hidden><Icon size={26} /></span>
                <span className={contoh.cardCat}>Bab {String.fromCharCode(65 + i)}</span>
                <h2 className={contoh.cardTitle}>{m.title}</h2>
                <span className={contoh.cardMeta}>{m.minutes} menit baca</span>
                <span className={contoh.cardCta}>Baca materi</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
