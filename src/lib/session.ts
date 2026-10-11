// Akun & sesi. Mode API: backend Apps Script + Supabase. Mode lokal (tanpa NEXT_PUBLIC_API_URL): akun demo di localStorage.
import { apiEnabled, call, getToken, setOnExpired, setToken } from "./api";
import { clearLocalData, pullAll } from "./sync";

export type Role = "siswa" | "guru";
export type User = { role: Role; username: string; name: string; id?: string; kelas?: string };
type Account = User & { password: string; replaces?: string }; // replaces = username akun demo yang sudah diubah
type AuthResult = { token: string; user: User };

// Akun demo untuk mode lokal (dan sebagai isi data awal di Supabase: supabase/seed.sql)
const DEMO_ACCOUNTS: Account[] = [
  { role: "siswa", username: "aisyah", password: "siswa123", name: "Aisyah Rahmawati" },
  { role: "siswa", username: "budi", password: "siswa123", name: "Budi Santoso" },
  { role: "guru", username: "guru", password: "guru123", name: "Ibu Sari" },
];

const ACCOUNTS_KEY = "ideaksi_accounts";
const USER_KEY = "ideaksi_user";
const SESSION_EVENT = "ideaksi-session";
const USERNAME_RULE = /^[a-z0-9_.]{3,20}$/;

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Terjadi kesalahan.");

function registered(): Account[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Akun demo yang sudah diubah pemiliknya digantikan salinannya di localStorage.
function allAccounts(): Account[] {
  const reg = registered();
  const replaced = new Set(reg.map((a) => a.replaces));
  return [...DEMO_ACCOUNTS.filter((a) => !replaced.has(a.username)), ...reg];
}

function saveSession({ role, username, name, id, kelas }: User): User {
  const user = { role, username, name, id, kelas };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
  return user;
}

// Setelah masuk lewat API: simpan token, lalu tarik data siswa ke localStorage.
async function startApiSession(res: AuthResult) {
  clearLocalData();
  setToken(res.token);
  if (res.user.role === "siswa") await pullAll().catch(() => {});
  saveSession(res.user);
}

// Mengembalikan pesan error, atau null jika berhasil.
export async function login(role: Role, username: string, password: string): Promise<string | null> {
  const uname = username.trim().toLowerCase();
  if (apiEnabled) {
    try {
      await startApiSession(await call<AuthResult>("auth.login", { role, username: uname, password }));
      return null;
    } catch (e) {
      return errorText(e);
    }
  }
  const acc = allAccounts().find((a) => a.role === role && a.username === uname && a.password === password);
  if (!acc) return "Username atau password salah.";
  saveSession(acc);
  return null;
}

// Mengembalikan pesan error, atau null jika berhasil.
export async function registerSiswa(name: string, username: string, password: string): Promise<string | null> {
  const uname = username.trim().toLowerCase();
  if (!USERNAME_RULE.test(uname)) return "Username 3–20 karakter: huruf, angka, titik, atau garis bawah.";
  if (password.length < 6) return "Password minimal 6 karakter.";
  if (apiEnabled) {
    try {
      await startApiSession(await call<AuthResult>("auth.register", { name: name.trim(), username: uname, password }));
      return null;
    } catch (e) {
      return errorText(e);
    }
  }
  if (allAccounts().some((a) => a.username === uname)) return "Username sudah dipakai. Coba yang lain.";
  const acc: Account = { role: "siswa", username: uname, password, name: name.trim() };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...registered(), acc]));
  saveSession(acc);
  return null;
}

// Ubah nama, username, dan (opsional) password akun yang sedang masuk. Mengembalikan pesan error atau null.
export async function updateProfile(current: User, name: string, username: string, password: string): Promise<string | null> {
  const uname = username.trim().toLowerCase();
  if (name.trim().length < 3) return "Nama minimal 3 huruf.";
  if (!USERNAME_RULE.test(uname)) return "Username 3–20 karakter: huruf, angka, titik, atau garis bawah.";
  if (password && password.length < 6) return "Password baru minimal 6 karakter.";
  if (apiEnabled) {
    try {
      saveSession(await call<User>("profile.update", { name: name.trim(), username: uname, password }));
      return null;
    } catch (e) {
      return errorText(e);
    }
  }
  const all = allAccounts();
  const acc = all.find((a) => a.role === current.role && a.username === current.username);
  if (!acc) return "Akun tidak ditemukan. Coba keluar lalu masuk lagi.";
  if (uname !== acc.username && all.some((a) => a.username === uname)) return "Username sudah dipakai. Coba yang lain.";

  const isDemo = DEMO_ACCOUNTS.includes(acc);
  const next: Account = {
    ...acc,
    name: name.trim(),
    username: uname,
    password: password || acc.password,
    replaces: acc.replaces ?? (isDemo ? acc.username : undefined),
  };
  const reg = registered().filter((a) => a.username !== acc.username);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...reg, next]));
  saveSession(next);
  return null;
}

// Keluar langsung: sesi lokal dibuang seketika (layout lalu menghapus cookie server & pindah ke /masuk).
// Sesi di database dihapus di latar belakang memakai token yang tadi dipegang.
export function logout() {
  const token = getToken();
  if (apiEnabled) {
    if (token) call("auth.logout", { token }).catch(() => {});
    setToken(null);
    clearLocalData(); // data siswa lain tidak boleh tertinggal di perangkat bersama
  }
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// Mode API: halaman /masuk hanya bisa terbuka kalau cookie server tidak sah (lihat proxy.ts),
// jadi sesi yang masih tersimpan di browser sudah basi -> buang tanpa mengalihkan halaman.
export function forgetLocalSession() {
  setToken(null);
  clearLocalData();
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// Sesi di browser hilang (mis. data situs dihapus) tapi cookie server masih ada: hapus cookie-nya.
export async function endServerSession() {
  if (apiEnabled) await call("auth.logout").catch(() => {});
}

// Token ditolak server (kedaluwarsa) => keluar, layout akan mengarahkan ke /masuk.
if (typeof window !== "undefined") setOnExpired(logout);

// Untuk useSyncExternalStore: snapshot berupa string mentah supaya stabil antar render.
export function subscribeSession(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const readSession = () => localStorage.getItem(USER_KEY);

// Shortcut development: masuk langsung pakai akun demo pertama sesuai peran. Hapus bersama DevLogin.tsx.
export async function devLogin(role: Role): Promise<string | null> {
  const acc = (apiEnabled ? DEMO_ACCOUNTS : allAccounts()).find((a) => a.role === role)!;
  return login(role, acc.username, acc.password);
}

// Halaman terakhir yang dibuka, supaya reload/buka ulang tidak kembali ke login.
const LAST_PATH_KEY = "ideaksi_last_path";
export const rememberPath = (path: string) => localStorage.setItem(LAST_PATH_KEY, path);
export const lastPath = () => localStorage.getItem(LAST_PATH_KEY);
