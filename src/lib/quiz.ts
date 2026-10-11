import { useSyncExternalStore } from "react";
import { fire } from "./api";

// Kuis "Misi Artikel Ilmiah Populer" (dari guru). Kunci sudah diperiksa ulang terhadap isi soal & materi:
// kunci awal bergeser di no. 1, 2, 4, 5, 6, 9 — yang benar: 1D 2B 3A 4B 5C 6A+C 7Benar 8Salah 9D 10D.

export type QuizQuestion = {
  type: "single" | "multi" | "truefalse";
  question: string;
  options: string[]; // truefalse: ["Benar", "Salah"]
  answer: number[]; // indeks opsi yang benar
  explain: string;
};

export const QUIZ_TITLE = "Misi Artikel Ilmiah Populer";

export const QUIZ: QuizQuestion[] = [
  {
    type: "single",
    question: "Apa yang dimaksud dengan artikel ilmiah populer?",
    options: [
      "Tulisan yang berisi cerita khayalan untuk hiburan",
      "Tulisan yang hanya berisi pendapat pribadi penulis",
      "Tulisan yang selalu menggunakan istilah teknis yang rumit",
      "Tulisan ilmiah dengan bahasa yang mudah dipahami masyarakat",
    ],
    answer: [3],
    explain: "Artikel ilmiah populer membahas pengetahuan atau informasi ilmiah dengan bahasa yang mudah dipahami masyarakat umum.",
  },
  {
    type: "single",
    question: "Manakah yang paling tepat menjadi judul artikel ilmiah populer?",
    options: [
      "Petualangan Ajaib di Negeri Awan",
      "Mengapa Tanaman Membutuhkan Cahaya Matahari?",
      "Tokoh Hebat dalam Cerita Khayalan",
      "Puisi untuk Sahabat Tersayang",
    ],
    answer: [1],
    explain: "Judul ini membahas fenomena nyata yang bisa dijelaskan dengan fakta. Pilihan lain adalah cerita khayalan atau puisi.",
  },
  {
    type: "single",
    question: "Bagian artikel yang memperkenalkan topik dan menarik perhatian pembaca disebut ...",
    options: ["Pembuka atau pendahuluan", "Isi atau pembahasan", "Penutup atau simpulan", "Daftar pustaka"],
    answer: [0],
    explain: "Pembuka berisi pengenalan topik, latar belakang, atau pertanyaan yang menarik perhatian pembaca.",
  },
  {
    type: "single",
    question:
      "Perhatikan kalimat berikut: “Menurut saya, membawa botol minum sendiri merupakan kebiasaan yang sangat baik.” Kalimat tersebut termasuk ...",
    options: ["Fakta hasil pengukuran", "Opini atau pendapat", "Definisi ilmiah", "Data hasil penelitian"],
    answer: [1],
    explain: "Ada penanda “Menurut saya” dan penilaian “sangat baik”, jadi kalimat ini berisi pendapat, bukan fakta.",
  },
  {
    type: "single",
    question: "Manakah kalimat yang paling jelas menyampaikan fakta yang dapat diperiksa?",
    options: [
      "Perpustakaan itu adalah tempat paling menyenangkan.",
      "Sepertinya semua siswa menyukai membaca.",
      "Berdasarkan catatan sekolah, perpustakaan memiliki 800 buku.",
      "Menurut saya, buku cetak lebih bagus daripada buku digital.",
    ],
    answer: [2],
    explain: "Jumlah buku dari catatan sekolah bisa diperiksa kebenarannya. Pilihan lain berupa penilaian, dugaan, atau pendapat.",
  },
  {
    type: "multi",
    question: "Pilih semua ciri artikel ilmiah populer yang tepat.",
    options: [
      "Menggunakan bahasa yang mudah dipahami",
      "Selalu harus menggunakan istilah teknis yang sulit",
      "Menyampaikan informasi yang didukung sumber tepercaya",
      "Boleh mengarang data agar tulisan lebih menarik",
    ],
    answer: [0, 2],
    explain: "Artikel ilmiah populer memakai bahasa sederhana dan didukung sumber tepercaya. Istilah sulit bukan keharusan, dan data tidak boleh dikarang.",
  },
  {
    type: "truefalse",
    question: "Bagian isi artikel ilmiah populer dapat memuat penjelasan, fakta, contoh, dan data pendukung.",
    options: ["Benar", "Salah"],
    answer: [0],
    explain: "Benar. Bagian isi berisi penjelasan utama yang didukung fakta, data, alasan, contoh, atau hasil penelitian.",
  },
  {
    type: "truefalse",
    question: "Artikel ilmiah populer tidak perlu memeriksa kebenaran sumber selama bahasanya menarik.",
    options: ["Benar", "Salah"],
    answer: [1],
    explain: "Salah. Informasi harus diperiksa kebenarannya dan didukung sumber tepercaya, semenarik apa pun bahasanya.",
  },
  {
    type: "single",
    question: "Kata “sehingga” dalam kalimat “Hujan turun deras sehingga jalanan tergenang” menunjukkan hubungan ...",
    options: ["Pilihan", "Perbandingan", "Pertentangan", "Sebab dan akibat"],
    answer: [3],
    explain: "“Sehingga” adalah konjungsi sebab-akibat: hujan deras (sebab) membuat jalanan tergenang (akibat).",
  },
  {
    type: "single",
    question: "Apa yang sebaiknya dilakukan sebelum artikel ilmiah populer dipublikasikan?",
    options: [
      "Mengganti fakta dengan pendapat pribadi",
      "Menambahkan klaim yang belum diperiksa",
      "Menghapus semua sumber agar lebih singkat",
      "Memeriksa fakta, sumber, ejaan, dan kejelasan tulisan",
    ],
    answer: [3],
    explain: "Sebelum dipublikasikan, artikel perlu diperiksa dan disunting: fakta, sumber, ejaan, tanda baca, dan kejelasan kalimat.",
  },
];

export const isCorrect = (q: QuizQuestion, picked: number[]) =>
  picked.length === q.answer.length && q.answer.every((a) => picked.includes(a));

const EVENT = "ideaksi-quiz";

function subscribeStorage(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// Skor terbaik (0-100). undefined = belum terbaca, null = belum pernah mengerjakan.
export function useQuizBest(): number | null | undefined {
  const raw = useSyncExternalStore(subscribeStorage, () => localStorage.getItem(KEY), () => undefined);
  if (raw === undefined) return undefined;
  try {
    return raw ? (JSON.parse(raw).best as number) : null;
  } catch {
    return null;
  }
}

// Skor terbaik di-cache di localStorage; setiap percobaan juga dikirim ke server (mode API).
const KEY = "ideaksi_quiz";
export function saveQuizScore(score: number) {
  fire("quiz.save", { score });
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!prev || score >= prev.best) {
      localStorage.setItem(KEY, JSON.stringify({ best: score, date: new Date().toISOString() }));
      window.dispatchEvent(new Event(EVENT));
    }
  } catch {}
}
