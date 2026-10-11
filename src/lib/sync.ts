// Sinkronisasi data siswa: server (Supabase lewat Apps Script) -> cache localStorage.
// Semua hook (useArticles, useQuizBest, useReadCount, useChats) membaca cache ini, jadi UI tetap cepat dan bisa offline.
import { call, fire } from "./api";

type Pulled = {
  articles: unknown[];
  quizBest: number | null;
  materiRead: string[];
  chats: unknown[];
};

// key localStorage -> event yang membuat hook terkait membaca ulang
const CACHES: Record<string, string> = {
  ideaksi_articles: "ideaksi-articles",
  ideaksi_quiz: "ideaksi-quiz",
  ideaksi_materi_read: "ideaksi-materi",
  ideaksi_chats: "ideaksi-chats",
};

function write(key: string, value: unknown) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(CACHES[key]));
}

type Stamped = { id: string; updated: string };

// Artikel lokal yang lebih baru dari server (simpanan belum terkirim, mis. tab ditutup) dipertahankan lalu dikirim ulang.
function mergeArticles(server: Stamped[]): Stamped[] {
  let local: Stamped[] = [];
  try {
    local = JSON.parse(localStorage.getItem("ideaksi_articles") ?? "[]");
  } catch {}
  const byId = new Map(server.map((a) => [a.id, a]));
  for (const a of local) {
    const s = byId.get(a.id);
    if (!s || new Date(a.updated) > new Date(s.updated)) {
      byId.set(a.id, a);
      fire("article.save", { article: a });
    }
  }
  return [...byId.values()].sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function pullAll() {
  const d = await call<Pulled>("data.pull");
  write("ideaksi_articles", mergeArticles(d.articles as Stamped[]));
  write("ideaksi_quiz", d.quizBest == null ? null : { best: d.quizBest });
  write("ideaksi_materi_read", d.materiRead);
  write("ideaksi_chats", d.chats);
}

export function clearLocalData() {
  for (const key of Object.keys(CACHES)) write(key, null);
}
