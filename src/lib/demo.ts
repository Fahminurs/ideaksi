// ponytail: data contoh, ganti dengan data artikel asli saat halaman menulis jadi

export type DraftArticle = { id: string; title: string; stage: number; updated: string };
export type DoneArticle = { id: string; title: string; finished: string; words: number };

export const DEMO_DRAFTS: DraftArticle[] = [
  // stage = tahap yang sedang dikerjakan (1-6)
  { id: "1", title: "Dampak Gadget terhadap Kesehatan Remaja", stage: 4, updated: "10 Oktober 2026" },
];

export const DEMO_DONE: DoneArticle[] = [
  { id: "2", title: "Bahaya Sampah Plastik bagi Lingkungan", finished: "5 Oktober 2026", words: 850 },
  { id: "3", title: "Mengapa Kita Harus Hemat Air?", finished: "28 September 2026", words: 720 },
];

export const DEMO_DASHBOARD = {
  article: DEMO_DRAFTS[0],
  stats: { active: DEMO_DRAFTS.length, done: DEMO_DONE.length, quiz: 80 },
};
