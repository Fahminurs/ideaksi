// Cookie login bertanda tangan (HMAC-SHA256) berisi role + kedaluwarsa.
// Dibaca proxy.ts untuk menjaga rute (seperti middleware Laravel) tanpa query ke database.
// Web Crypto dipakai supaya jalan di runtime mana pun (Node / Edge).
export const AUTH_COOKIE = "ideaksi_auth";
export const AUTH_MAX_AGE = 30 * 24 * 60 * 60; // detik, sama dengan umur sesi di server

export type Role = "siswa" | "guru";

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function key() {
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_KEY;
  if (!secret) throw new Error("AUTH_SECRET belum diisi");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signAuth(role: Role): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ r: role, e: Date.now() + AUTH_MAX_AGE * 1000 })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

// Role kalau cookie sah & belum kedaluwarsa, selain itu null.
export async function verifyAuth(value: string | undefined): Promise<Role | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const { r, e } = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return (r === "siswa" || r === "guru") && e > Date.now() ? r : null;
  } catch {
    return null;
  }
}
