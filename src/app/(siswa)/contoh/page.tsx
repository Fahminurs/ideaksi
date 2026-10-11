import Link from "next/link";
import BelajarTabs from "../BelajarTabs";
import { CATEGORIES } from "@/lib/topics";
import { stageVars } from "@/lib/stages";
import { EXAMPLES, readMinutes, wordCount } from "@/lib/examples";
import styles from "./contoh.module.css";

// warna kartu per kategori (pakai warna tahap)
const CATEGORY_STAGE: Record<string, number> = { lingkungan: 3, kesehatan: 5, teknologi: 4 };

export default function ContohPage() {
  return (
    <div className={styles.page}>
      <BelajarTabs current="contoh" />
      <header className={styles.header}>
        <h1>Contoh artikel</h1>
        <p>Baca artikel yang sudah jadi. Setiap bagian diberi warna dan catatan, supaya kamu tahu kenapa tulisannya bagus.</p>
      </header>

      <ul className={styles.gallery}>
        {EXAMPLES.map((e) => {
          const cat = CATEGORIES.find((c) => c.id === e.category)!;
          const Icon = cat.icon;
          return (
            <li key={e.slug} style={stageVars(CATEGORY_STAGE[e.category])}>
              <Link href={`/contoh/${e.slug}`} className={styles.card}>
                <img className={styles.cardArt} src={`/ilustrasi/${e.slug}.svg`} alt="" width={500} height={500} loading="lazy" />
                <span className={styles.cardIcon} aria-hidden><Icon size={26} /></span>
                <span className={styles.cardCat}>{cat.label}</span>
                <h2 className={styles.cardTitle}>{e.title}</h2>
                <span className={styles.cardMeta}>
                  {readMinutes(e)} menit baca, ±{wordCount(e)} kata
                </span>
                <span className={styles.cardCta}>Baca artikel</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
