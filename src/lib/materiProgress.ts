"use client";

// Bab materi yang sudah dibuka siswa: cache localStorage + dikirim ke server (mode API).
import { useSyncExternalStore } from "react";
import { fire } from "./api";

const KEY = "ideaksi_materi_read";
const EVENT = "ideaksi-materi";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function markRead(slug: string) {
  const list = read();
  if (list.includes(slug)) return;
  localStorage.setItem(KEY, JSON.stringify([...list, slug]));
  window.dispatchEvent(new Event(EVENT));
  fire("materi.read", { slug });
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// Jumlah bab yang sudah dibaca. undefined = belum terbaca.
export function useReadCount(): number | undefined {
  return useSyncExternalStore(subscribe, () => read().length, () => undefined);
}
