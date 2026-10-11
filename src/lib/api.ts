// Klien backend (Google Apps Script Web App).
// NEXT_PUBLIC_API_URL kosong => aplikasi berjalan dalam mode lokal (localStorage saja, AI pakai template).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const apiEnabled = API_URL !== "";

const TOKEN_KEY = "ideaksi_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {}

// Dipanggil saat token ditolak server; diisi oleh session.ts (hindari import melingkar).
let onExpired: (() => void) | null = null;
export const setOnExpired = (fn: () => void) => (onExpired = fn);

export async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    // text/plain supaya tidak ada preflight CORS (Apps Script tidak menjawab OPTIONS)
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: getToken(), ...payload }),
    });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server. Periksa internetmu.");
  }
  const out = (await res.json().catch(() => null)) as { ok: boolean; data?: T; error?: string } | null;
  if (!out) throw new ApiError("Server sedang bermasalah. Coba lagi.");
  if (!out.ok) {
    if (/Sesi berakhir/.test(out.error ?? "")) onExpired?.();
    throw new ApiError(out.error ?? "Terjadi kesalahan.");
  }
  return out.data as T;
}

// Simpan di latar belakang lewat antrean berurutan, supaya simpanan lama tidak menimpa yang baru.
// Kegagalan hanya dicatat (data tetap aman di localStorage).
let queue: Promise<unknown> = Promise.resolve();
export function fire(action: string, payload: Record<string, unknown> = {}) {
  if (!apiEnabled) return;
  queue = queue.then(() => call(action, payload).catch((e) => console.warn(`[ideaksi] ${action} gagal:`, e.message)));
}
