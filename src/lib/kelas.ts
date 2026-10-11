// Data kelas untuk dashboard guru.
// ponytail: data contoh statis; nanti diambil dari Supabase (artikel, kuis, materi tiap siswa).

export type Student = {
  id: string;
  name: string;
  stage: number; // tahap yang sedang dikerjakan (1-6); 0 = belum mulai; 7 = selesai
  quiz: number | null; // skor terbaik 0-100, null = belum mengerjakan
  materi: number; // bab materi yang sudah dibuka (dari 9)
  updated: string; // ISO
  article?: {
    title: string;
    topic: string;
    question: string;
    facts: number;
    outlineGenerated: number;
    draftGenerated: number;
    revisions: number;
    words: number;
    body?: string; // artikel final (untuk yang selesai)
  };
};

export const CLASS_NAME = "Kelas VIII";
export const MATERI_TOTAL = 9;

const GADGET_BODY = [
  "Pernahkah kamu menghitung berapa jam kamu memegang gadget setiap hari? Bagi banyak remaja, gadget sudah menjadi teman sejak bangun tidur sampai menjelang tidur. Lalu, bagaimana penggunaan gadget yang berlebihan memengaruhi kesehatan remaja?",
  "Menurut Kementerian Kesehatan (2024), sebagian besar remaja Indonesia memakai gadget lebih dari lima jam per hari. Waktu selama itu sering diambil dari jam tidur dan jam bermain di luar rumah.",
  "WHO (2023) juga mencatat bahwa cahaya biru dari layar dapat mengganggu kualitas tidur. Akibatnya, remaja lebih mudah mengantuk dan sulit berkonsentrasi di sekolah.",
  "Gadget memang membantu kita belajar dan berkomunikasi. Namun, penggunaannya perlu dibatasi. Mulailah dengan menyimpan gadget satu jam sebelum tidur dan menggantinya dengan membaca buku atau berolahraga.",
].join("\n\n");

const a = (title: string, topic: string, question: string, extra: Partial<NonNullable<Student["article"]>> = {}) => ({
  title, topic, question, facts: 0, outlineGenerated: 0, draftGenerated: 0, revisions: 0, words: 0, ...extra,
});

export const STUDENTS: Student[] = [
  {
    id: "aisyah", name: "Aisyah Rahmawati", stage: 7, quiz: 90, materi: 9, updated: "2026-10-10T09:00:00Z",
    article: a("Dampak Gadget terhadap Kesehatan Remaja: Fakta yang Perlu Kamu Tahu", "Dampak gadget terhadap kesehatan remaja",
      "Bagaimana penggunaan gadget berlebihan memengaruhi kesehatan remaja?",
      { facts: 3, outlineGenerated: 1, draftGenerated: 1, revisions: 2, words: 142, body: GADGET_BODY }),
  },
  {
    id: "budi", name: "Budi Santoso", stage: 5, quiz: 80, materi: 7, updated: "2026-10-11T02:30:00Z",
    article: a("Bahaya Sampah Plastik di Sungai", "Sampah plastik di sungai", "Mengapa sampah plastik di sungai berbahaya bagi makhluk hidup?",
      { facts: 4, outlineGenerated: 2 }),
  },
  {
    id: "citra", name: "Citra Dewi", stage: 3, quiz: 70, materi: 5, updated: "2026-10-10T13:10:00Z",
    article: a("", "Manfaat sarapan bagi pelajar", "Apa manfaat sarapan bagi konsentrasi belajar pelajar?", { facts: 1 }),
  },
  {
    id: "doni", name: "Doni Pratama", stage: 2, quiz: 60, materi: 3, updated: "2026-10-09T08:45:00Z",
    article: a("", "Penggunaan AI di sekolah", ""),
  },
  { id: "eka", name: "Eka Wulandari", stage: 1, quiz: null, materi: 2, updated: "2026-10-08T10:00:00Z" },
  { id: "fira", name: "Fira Anjani", stage: 0, quiz: null, materi: 0, updated: "2026-10-01T07:00:00Z" },
  {
    id: "gilang", name: "Gilang Ramadhan", stage: 7, quiz: 100, materi: 9, updated: "2026-10-09T15:20:00Z",
    article: a("Mengapa Kita Harus Hemat Air?", "Hemat air di rumah", "Mengapa menghemat air penting bagi masa depan?",
      { facts: 3, outlineGenerated: 1, draftGenerated: 2, revisions: 3, words: 156 }),
  },
  {
    id: "hana", name: "Hana Putri", stage: 4, quiz: 90, materi: 8, updated: "2026-10-11T01:00:00Z",
    article: a("", "Manfaat menanam pohon di sekolah", "Bagaimana pohon di sekolah membantu kenyamanan belajar?", { facts: 3, outlineGenerated: 1 }),
  },
  {
    id: "irfan", name: "Irfan Hakim", stage: 6, quiz: 70, materi: 6, updated: "2026-10-10T11:40:00Z",
    article: a("Polusi Udara dan Kesehatan Paru-Paru", "Polusi udara di kota", "Bagaimana polusi udara memengaruhi kesehatan paru-paru?",
      { facts: 3, outlineGenerated: 1, draftGenerated: 1, revisions: 1, words: 133 }),
  },
  {
    id: "jihan", name: "Jihan Salsabila", stage: 3, quiz: 50, materi: 4, updated: "2026-10-09T12:00:00Z",
    article: a("", "Bahaya jajanan berpewarna", "Apa dampak pewarna buatan pada jajanan bagi kesehatan?", { facts: 2 }),
  },
];

export const statusOf = (s: Student) => (s.stage === 7 ? "selesai" : s.stage === 0 ? "belum" : "aktif");
// tahap yang sudah dilewati (0-6), untuk progress bar
export const stepsDone = (s: Student) => (s.stage === 7 ? 6 : Math.max(0, s.stage - 1));
