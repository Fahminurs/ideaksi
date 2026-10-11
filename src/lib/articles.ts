"use client";

// Artikel siswa: cache localStorage (cepat & bisa offline) + disimpan ke server di latar belakang (mode API).
import { useMemo, useSyncExternalStore } from "react";
import { apiEnabled, fire } from "./api";

export type Fact = { fact: string; source: string };

export type Article = {
  id: string;
  stage: number; // tahap tertinggi yang sudah terbuka (1-6)
  updated: string; // ISO
  topic?: { category: string; text: string };
  question?: { main: string; subs: string[] };
  facts?: Fact[];
  outline?: { pendahuluan: string; isi: string; penutup: string };
  draft?: { title: string; body: string }; // hasil AI tahap 5 (asli, tidak diubah)
  revision?: { title: string; body: string; count: number; checks: boolean[] }; // tulisan siswa tahap 6
  doneAt?: string; // ISO, diisi saat "Tandai selesai"
  gen?: { outline: number; draft: number }; // berapa kali Dea membuat kerangka/draft (untuk guru)
};

const KEY = "ideaksi_articles";
const EVENT = "ideaksi-articles";

// ponytail: satu artikel contoh supaya dashboard & daftar artikel tidak kosong saat demo
const SEED: Article[] = [
  {
    id: "1",
    stage: 4,
    updated: "2026-10-10T09:00:00.000Z",
    topic: { category: "kesehatan", text: "Dampak Gadget terhadap Kesehatan Remaja" },
    question: {
      main: "Bagaimana penggunaan gadget berlebihan memengaruhi kesehatan remaja?",
      subs: ["Berapa lama rata-rata remaja memakai gadget setiap hari?"],
    },
    facts: [
      { fact: "Sebagian besar remaja memakai gadget lebih dari 5 jam per hari.", source: "Contoh sumber, 2024" },
      { fact: "Cahaya biru dari layar gadget dapat mengganggu kualitas tidur.", source: "Contoh sumber, 2023" },
      { fact: "Duduk terlalu lama saat bermain gadget membuat tubuh kurang bergerak.", source: "Contoh sumber, 2023" },
    ],
  },
];

function readRaw() {
  return localStorage.getItem(KEY);
}

function readAll(): Article[] {
  try {
    const raw = readRaw();
    return raw ? JSON.parse(raw) : apiEnabled ? [] : SEED;
  } catch {
    return apiEnabled ? [] : SEED;
  }
}

function writeAll(list: Article[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function createArticle(): Article {
  const a: Article = { id: crypto.randomUUID(), stage: 1, updated: new Date().toISOString() };
  writeAll([a, ...readAll()]);
  fire("article.save", { article: a });
  return a;
}

export function saveArticle(a: Article) {
  const next = { ...a, updated: new Date().toISOString() };
  writeAll(readAll().map((x) => (x.id === a.id ? next : x)));
  fire("article.save", { article: next });
}

export function deleteArticle(id: string) {
  writeAll(readAll().filter((x) => x.id !== id));
  fire("article.delete", { id });
}

// undefined = belum terbaca (render server/hidrasi), null = tidak ditemukan.
export function useArticle(id: string): Article | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    return readAll().find((a) => a.id === id) ?? null;
  }, [raw, id]);
}

// Artikel yang terakhir diedit (untuk konteks Tanya Dea). undefined = belum terbaca.
export function useLatestArticle(): Article | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    return [...readAll()].sort((a, b) => b.updated.localeCompare(a.updated))[0] ?? null;
  }, [raw]);
}

// Semua artikel, terbaru dulu. undefined = belum terbaca.
export function useArticles(): Article[] | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(
    () => (raw === undefined ? undefined : [...readAll()].sort((a, b) => b.updated.localeCompare(a.updated))),
    [raw],
  );
}
