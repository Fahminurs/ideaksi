"use client";

// Panduan singkat "cara mengisi" di atas tiap tahap. Terbuka otomatis saat pertama kali tahap itu dibuka,
// setelah ditutup tidak terbuka sendiri lagi (bisa dibuka ulang kapan saja).
import { useSyncExternalStore } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import styles from "./tahap.module.css";

const GUIDES: Record<number, { steps: string[]; example: string }> = {
  1: {
    steps: ["Pilih kategori yang kamu suka.", "Klik salah satu saran topik, atau tulis topikmu sendiri (minimal 3 kata).", "Tekan Simpan & lanjut."],
    example: "Manfaat Menanam Pohon di Sekolah",
  },
  2: {
    steps: ["Tulis SATU pertanyaan utama yang akan dijawab artikelmu.", "Awali dengan kata tanya, akhiri dengan tanda tanya (?), minimal 6 kata.", "Tunggu sampai 3 tanda wajib menyala hijau. Sub-pertanyaan boleh dikosongkan."],
    example: "Bagaimana penggunaan gadget berlebihan memengaruhi kesehatan remaja?",
  },
  3: {
    steps: ["Isi minimal 3 kartu fakta yang menjawab pertanyaanmu.", "Tiap fakta minimal 5 kata dan harus bisa dibuktikan (bukan pendapat).", "Tulis sumbernya: nama lembaga/orang + tahun."],
    example: "Fakta: Remaja membutuhkan tidur 8–10 jam setiap malam. Sumber: Kementerian Kesehatan, 2023",
  },
  4: {
    steps: ["Tekan Buatkan kerangka, Dea menyusunnya dari fakta-faktamu.", "Baca tiap bagian, ubah kalau ada yang kurang pas.", "Tekan Simpan & lanjut."],
    example: "Isi: 1. Menurut Kemenkes (2023), remaja butuh tidur 8–10 jam…",
  },
  5: {
    steps: ["Tekan Buatkan draft, Dea menulis judul dan artikel dari kerangkamu.", "Ubah judulnya kalau kamu punya ide lebih menarik.", "Kurang cocok? Tekan Buatkan ulang."],
    example: "Judul: Rahasia Tidur Cukup untuk Konsentrasi Belajar",
  },
  6: {
    steps: ["Baca draft dari Dea, lalu perbaiki dengan kata-katamu sendiri di kolom Revisimu.", "Centang 4 daftar cek revisi.", "Tekan Tandai selesai, lalu Unduh PDF."],
    example: "Ganti kalimat yang terlalu panjang dan cek lagi ejaannya.",
  },
};

const key = (step: number) => `ideaksi_guide_${step}`;
const noop = () => () => {};

export default function StageGuide({ step }: { step: number }) {
  // server: anggap sudah dilihat (tertutup) supaya tidak beda saat hidrasi
  const seen = useSyncExternalStore(noop, () => localStorage.getItem(key(step)) === "1", () => true);
  const guide = GUIDES[step];
  if (!guide) return null;

  return (
    <details
      className={styles.guide}
      open={!seen}
      onToggle={(e) => {
        if (!e.currentTarget.open) localStorage.setItem(key(step), "1");
      }}
    >
      <summary>
        <span className={styles.guideOrb} aria-hidden><Sparkles size={18} /></span>
        <span className={styles.guideTitle}>Cara mengisi tahap ini</span>
        <ChevronDown size={18} className={styles.guideChevron} aria-hidden />
      </summary>
      <ol className={styles.guideSteps}>
        {guide.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <p className={styles.guideExample}><strong>Contoh:</strong> {guide.example}</p>
    </details>
  );
}
