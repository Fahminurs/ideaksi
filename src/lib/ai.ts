// Generator kerangka & draft. Mode API: Gemini lewat backend Apps Script.
// Mode lokal (tanpa backend): template sederhana dari data siswa.
import { apiEnabled, call } from "./api";
import type { Article, Fact } from "./articles";

export type Outline = NonNullable<Article["outline"]>;
export type Draft = NonNullable<Article["draft"]>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const noDot = (s: string) => s.trim().replace(/[.!?]+$/, "");

// "Kementerian Kesehatan, 2024" -> "Menurut Kementerian Kesehatan (2024), ..."
function cite(f: Fact) {
  const [who, year] = f.source.split(/,\s*(?=\d{4})/);
  const by = year ? `${who.trim()} (${year.trim()})` : f.source.trim();
  return `Menurut ${by}, ${lower(noDot(f.fact))}.`;
}

export async function generateOutline(a: Article): Promise<Outline> {
  if (apiEnabled) return call<Outline>("ai.outline", { article: a });
  await wait(1200);
  const topic = a.topic?.text ?? "topik ini";
  const q = a.question?.main ?? "";
  const facts = a.facts ?? [];
  return {
    pendahuluan: `Kenalkan topik "${topic}" dengan hal yang dekat dengan pembaca. Ajukan pertanyaan: ${q}`,
    isi: facts.map((f, i) => `${i + 1}. ${noDot(f.fact)} (${f.source})`).join("\n"),
    penutup: `Jawab pertanyaan utama secara singkat, lalu beri saran yang bisa dilakukan pembaca terkait ${lower(topic)}.`,
  };
}

const TITLE_PATTERNS = [
  (t: string) => `${t}: Fakta yang Perlu Kamu Tahu`,
  (t: string) => `Mengenal ${t} Lebih Dekat`,
  (t: string) => `${t}, Apa Kata Para Ahli?`,
];

export async function generateDraft(a: Article, variant = 0): Promise<Draft> {
  if (apiEnabled) return call<Draft>("ai.draft", { article: a, variant });
  await wait(1600);
  const topic = a.topic?.text ?? "Topik Artikel";
  const q = a.question?.main ?? "";
  const facts = a.facts ?? [];
  const o = a.outline;

  const pendahuluan =
    `Pernahkah kamu memikirkan tentang ${lower(topic)}? Hal ini sering kita temui dalam kehidupan sehari-hari, ` +
    `tetapi jarang kita pahami lebih dalam. ${q} Artikel ini akan membahasnya berdasarkan fakta dan data.`;

  const isi = [
    facts.slice(0, 2).map(cite).join(" ") +
      " Fakta tersebut menunjukkan bahwa masalah ini nyata dan dialami oleh banyak orang.",
    facts.slice(2).map(cite).join(" ") +
      (facts.length > 2 ? " Dengan kata lain, dampaknya bisa dirasakan dalam berbagai sisi kehidupan." : ""),
  ].filter((p) => p.trim().length > 1);

  const penutup =
    `Berdasarkan fakta-fakta tersebut, ${lower(topic)} perlu mendapat perhatian kita bersama. ` +
    (o?.penutup && !o.penutup.startsWith("Jawab") ? `${noDot(o.penutup)}. ` : "") +
    "Mulailah dari langkah kecil, karena perubahan besar selalu diawali dari diri sendiri.";

  return {
    title: TITLE_PATTERNS[variant % TITLE_PATTERNS.length](topic),
    body: [pendahuluan, ...isi, penutup].join("\n\n"),
  };
}

export const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const readMinutes = (s: string) => Math.max(1, Math.round(countWords(s) / 200));

// paragraf pertama = pendahuluan, terakhir = penutup, sisanya isi
export function partOf(i: number, total: number) {
  if (i === 0) return { label: "Pendahuluan", stage: 3 };
  if (i === total - 1) return { label: "Penutup", stage: 1 };
  return { label: "Isi", stage: 4 };
}
