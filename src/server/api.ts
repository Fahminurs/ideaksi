// Backend Vercel: login, data siswa/guru (Supabase), dan pengatur AI.
// Panggilan Gemini sendiri dikerjakan Apps Script (backend/Code.gs); di sini hanya cek sesi, batas harian, dan simpan hasil.
// Env (server saja, jangan NEXT_PUBLIC): SUPABASE_URL, SUPABASE_SERVICE_KEY, AI_URL, AI_SECRET
import { createHash, randomBytes } from "node:crypto";

const SESSION_DAYS = 30;
const CHAT_MEMORY = 6; // Dea hanya membawa 6 pesan terakhir dari obrolan yang sama (hemat kuota)
const DAILY_LIMIT = { chat: 40, outline: 10, draft: 10 } as const; // per siswa per hari
const USERNAME_RULE = /^[a-z0-9_.]{3,20}$/;

type Req = Record<string, unknown> & { action?: string; token?: string };
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Kind = keyof typeof DAILY_LIMIT;

export class UserError extends Error {}

// ======================= Supabase REST =======================

async function sb(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<Row[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new UserError("Server belum dikonfigurasi (Supabase).");
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : [];
}

const q = encodeURIComponent;

// ======================= Auth =======================

const hashPassword = (salt: string, password: string) => createHash("sha256").update(salt + password, "utf8").digest("hex");
const newToken = () => randomBytes(32).toString("hex");
const publicUser = (u: Row) => ({ id: u.id, role: u.role, username: u.username, name: u.name, kelas: u.kelas });

async function startSession(user: Row) {
  const token = newToken();
  await sb("POST", "sessions", { token, user_id: user.id, expires_at: new Date(Date.now() + SESSION_DAYS * 864e5).toISOString() },
    { Prefer: "return=minimal" });
  return { token, user: publicUser(user) };
}

async function login(r: Req) {
  const username = String(r.username ?? "").trim().toLowerCase();
  const [u] = await sb("GET", `users?username=eq.${q(username)}&select=*`);
  if (!u || u.role !== r.role || hashPassword(u.salt, String(r.password ?? "")) !== u.password_hash) {
    throw new UserError("Username atau password salah.");
  }
  return startSession(u);
}

function validateProfile(name: unknown, username: string, password: unknown, passwordRequired: boolean) {
  if (String(name ?? "").trim().length < 3) throw new UserError("Nama minimal 3 huruf.");
  if (!USERNAME_RULE.test(username)) throw new UserError("Username 3–20 karakter: huruf, angka, titik, atau garis bawah.");
  if ((passwordRequired || password) && String(password ?? "").length < 6) throw new UserError("Password minimal 6 karakter.");
}

async function usernameTaken(username: string, exceptId?: string) {
  const rows = await sb("GET", `users?username=eq.${q(username)}&select=id`);
  return rows.length > 0 && rows[0].id !== exceptId;
}

async function register(r: Req) {
  const username = String(r.username ?? "").trim().toLowerCase();
  validateProfile(r.name, username, r.password, true);
  if (await usernameTaken(username)) throw new UserError("Username sudah dipakai. Coba yang lain.");
  const salt = newToken().slice(0, 32);
  const [u] = await sb("POST", "users", {
    role: "siswa", username, name: String(r.name).trim(), salt, password_hash: hashPassword(salt, String(r.password)),
  });
  return startSession(u);
}

async function requireUser(r: Req, role?: "siswa" | "guru") {
  if (!r.token) throw new UserError("Sesi berakhir. Silakan masuk lagi.");
  const rows = await sb("GET", `sessions?token=eq.${q(r.token)}&expires_at=gt.${q(new Date().toISOString())}&select=user:users(*)`);
  const u = rows[0]?.user as Row | undefined;
  if (!u) throw new UserError("Sesi berakhir. Silakan masuk lagi.");
  if (role && u.role !== role) throw new UserError("Kamu tidak punya akses ke fitur ini.");
  return u;
}

async function logout(r: Req) {
  if (r.token) await sb("DELETE", `sessions?token=eq.${q(r.token)}`, undefined, { Prefer: "return=minimal" });
  return true;
}

async function updateProfile(r: Req) {
  const u = await requireUser(r);
  const username = String(r.username ?? "").trim().toLowerCase();
  validateProfile(r.name, username, r.password, false);
  if (await usernameTaken(username, u.id)) throw new UserError("Username sudah dipakai. Coba yang lain.");
  const patch: Row = { name: String(r.name).trim(), username };
  if (r.password) {
    patch.salt = newToken().slice(0, 32);
    patch.password_hash = hashPassword(patch.salt, String(r.password));
  }
  const [updated] = await sb("PATCH", `users?id=eq.${u.id}`, patch);
  return publicUser(updated);
}

// ======================= Data siswa =======================

function articleFromRow(a: Row) {
  const facts = ((a.facts ?? []) as Row[]).sort((x, y) => x.position - y.position);
  const out: Row = { id: a.id, stage: a.stage, updated: a.updated_at, gen: { outline: a.outline_generated, draft: a.draft_generated } };
  if (a.topic_text) out.topic = { category: a.topic_category ?? "", text: a.topic_text };
  if (a.question_main) out.question = { main: a.question_main, subs: a.question_subs ?? [] };
  if (facts.length) out.facts = facts.map((f) => ({ fact: f.fact, source: f.source }));
  if (a.outline) out.outline = a.outline;
  if (a.draft_body) out.draft = { title: a.draft_title ?? "", body: a.draft_body };
  if (a.revision_body) out.revision = { title: a.revision_title ?? "", body: a.revision_body, count: a.revision_count, checks: a.revision_checks ?? [] };
  if (a.done_at) out.doneAt = a.done_at;
  return out;
}

async function pullData(r: Req) {
  const u = await requireUser(r, "siswa");
  const [arts, quiz, reads, chats] = await Promise.all([
    sb("GET", `articles?user_id=eq.${u.id}&select=*,facts(fact,source,position)&order=updated_at.desc`),
    sb("GET", `quiz_attempts?user_id=eq.${u.id}&select=score&order=score.desc&limit=1`),
    sb("GET", `materi_reads?user_id=eq.${u.id}&select=slug`),
    sb("GET", `chat_sessions?user_id=eq.${u.id}&select=id,title,updated_at,chat_messages(role,content,id)&order=updated_at.desc&limit=20`),
  ]);
  return {
    user: publicUser(u),
    articles: arts.map(articleFromRow),
    quizBest: quiz.length ? quiz[0].score : null,
    materiRead: reads.map((x) => x.slug),
    chats: chats.map((c) => ({
      id: c.id, title: c.title, updated: c.updated_at,
      messages: ((c.chat_messages ?? []) as Row[]).sort((x, y) => x.id - y.id)
        .map((m) => ({ from: m.role === "user" ? "me" : "bot", text: m.content })),
    })),
  };
}

async function saveArticle(r: Req) {
  const u = await requireUser(r, "siswa");
  const a = (r.article ?? {}) as Row;
  if (!a.id || String(a.id).length > 64) throw new UserError("Data artikel tidak valid.");
  const p = {
    id: String(a.id),
    stage: Math.min(6, Math.max(1, Number(a.stage) || 1)),
    topic_category: a.topic?.category ?? null,
    topic_text: a.topic?.text ?? null,
    question_main: a.question?.main ?? null,
    question_subs: a.question?.subs ?? [],
    outline: a.outline ?? null,
    outline_generated: a.gen?.outline ?? 0,
    draft_title: a.draft?.title ?? null,
    draft_body: a.draft?.body ?? null,
    draft_generated: a.gen?.draft ?? 0,
    revision_title: a.revision?.title ?? null,
    revision_body: a.revision?.body ?? null,
    revision_count: a.revision?.count ?? 0,
    revision_checks: a.revision?.checks ?? [],
    done_at: a.doneAt ?? null,
    facts: ((a.facts ?? []) as Row[]).slice(0, 20),
  };
  try {
    await sb("POST", "rpc/save_article", { p_user: u.id, p });
  } catch (e) {
    if (String(e).includes("another user")) throw new UserError("Artikel ini bukan milikmu.");
    throw e;
  }
  return true;
}

async function deleteArticle(r: Req) {
  const u = await requireUser(r, "siswa");
  await sb("DELETE", `articles?id=eq.${q(String(r.id ?? ""))}&user_id=eq.${u.id}`, undefined, { Prefer: "return=minimal" });
  return true;
}

async function saveQuiz(r: Req) {
  const u = await requireUser(r, "siswa");
  const score = Math.round(Number(r.score));
  if (!(score >= 0 && score <= 100)) throw new UserError("Skor tidak valid.");
  await sb("POST", "quiz_attempts", { user_id: u.id, score }, { Prefer: "return=minimal" });
  return true;
}

async function readMateri(r: Req) {
  const u = await requireUser(r, "siswa");
  if (!/^[a-z0-9-]{2,40}$/.test(String(r.slug ?? ""))) throw new UserError("Bab tidak valid.");
  await sb("POST", "materi_reads?on_conflict=user_id,slug", { user_id: u.id, slug: r.slug },
    { Prefer: "resolution=ignore-duplicates,return=minimal" });
  return true;
}

// ======================= AI (lewat Apps Script) =======================

async function checkLimit(u: Row, kind: Kind) {
  // awal hari waktu Indonesia (WIB)
  const since = new Date(Math.floor((Date.now() + 7 * 36e5) / 864e5) * 864e5 - 7 * 36e5).toISOString();
  const rows = await sb("GET", `ai_usage?user_id=eq.${u.id}&kind=eq.${kind}&created_at=gte.${q(since)}&select=id`);
  if (rows.length >= DAILY_LIMIT[kind]) throw new UserError("Batas harian Dea untuk fitur ini sudah habis. Coba lagi besok, ya!");
}

async function ai<T extends Row>(task: string, payload: Row): Promise<T & { tokens: number }> {
  const url = process.env.AI_URL;
  const secret = process.env.AI_SECRET;
  if (!url || !secret) throw new UserError("Dea belum diaktifkan oleh admin.");
  let out: { ok: boolean; data?: T & { tokens: number }; error?: string };
  try {
    // Apps Script membalas dengan redirect; fetch mengikutinya otomatis
    const res = await fetch(url, { method: "POST", body: JSON.stringify({ secret, task, ...payload }), cache: "no-store" });
    out = await res.json();
  } catch {
    throw new UserError("Dea sedang sibuk. Coba lagi sebentar lagi, ya.");
  }
  if (!out.ok || !out.data) throw new UserError(out.error ?? "Dea sedang sibuk. Coba lagi sebentar lagi, ya.");
  return out.data;
}

const logUsage = (u: Row, kind: Kind, tokens: number) =>
  sb("POST", "ai_usage", { user_id: u.id, kind, tokens: tokens || 0 }, { Prefer: "return=minimal" });

async function aiOutline(r: Req) {
  const u = await requireUser(r, "siswa");
  await checkLimit(u, "outline");
  const { tokens, ...outline } = await ai<Row>("outline", { article: r.article });
  await logUsage(u, "outline", tokens);
  return outline;
}

async function aiDraft(r: Req) {
  const u = await requireUser(r, "siswa");
  await checkLimit(u, "draft");
  const { tokens, ...draft } = await ai<Row>("draft", { article: r.article, variant: r.variant });
  await logUsage(u, "draft", tokens);
  return draft;
}

async function sendChat(r: Req) {
  const u = await requireUser(r, "siswa");
  const text = String(r.message ?? "").trim().slice(0, 1000);
  if (!text) throw new UserError("Pesan kosong.");
  const sid = String(r.sessionId ?? "");
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(sid)) throw new UserError("Sesi obrolan tidak valid.");
  await checkLimit(u, "chat");

  const own = await sb("GET", `chat_sessions?id=eq.${q(sid)}&select=user_id`);
  if (own.length && own[0].user_id !== u.id) throw new UserError("Obrolan ini bukan milikmu.");
  if (!own.length) await sb("POST", "chat_sessions", { id: sid, user_id: u.id, title: text.slice(0, 80) }, { Prefer: "return=minimal" });

  // memori pendek: hanya beberapa pesan terakhir di obrolan ini
  const history = (await sb("GET", `chat_messages?session_id=eq.${q(sid)}&select=role,content&order=id.desc&limit=${CHAT_MEMORY}`)).reverse();
  const { reply, tokens } = await ai<{ reply: string }>("chat", { history, message: text, context: r.context ?? {} });

  await sb("POST", "chat_messages", [
    { session_id: sid, role: "user", content: text },
    { session_id: sid, role: "dea", content: reply },
  ], { Prefer: "return=minimal" });
  await sb("PATCH", `chat_sessions?id=eq.${q(sid)}`, { updated_at: new Date().toISOString() }, { Prefer: "return=minimal" });
  await logUsage(u, "chat", tokens);
  return { reply };
}

async function deleteChat(r: Req) {
  const u = await requireUser(r, "siswa");
  await sb("DELETE", `chat_sessions?id=eq.${q(String(r.sessionId ?? ""))}&user_id=eq.${u.id}`, undefined, { Prefer: "return=minimal" });
  return true;
}

// ======================= Guru =======================

function progressFromRow(s: Row) {
  return {
    id: s.id, username: s.username, name: s.name, kelas: s.kelas,
    stage: s.done_at ? 7 : s.stage || 0, // 0 = belum mulai, 7 = selesai
    quiz: s.quiz_best, materi: s.materi_read, updated: s.last_active,
    article: s.article_id ? {
      title: s.title ?? "", topic: s.topic_text ?? "", question: s.question_main ?? "",
      facts: s.facts, outlineGenerated: s.outline_generated, draftGenerated: s.draft_generated,
      revisions: s.revision_count, words: s.body ? String(s.body).trim().split(/\s+/).length : 0,
    } : undefined,
  };
}

async function guruStudents(r: Req) {
  await requireUser(r, "guru");
  const rows = await sb("GET", "student_progress?select=id,username,name,kelas,last_active,quiz_best,materi_read,article_id,stage,done_at,topic_text,question_main,title,facts,outline_generated,draft_generated,revision_count,body&order=name.asc");
  return rows.map(progressFromRow);
}

async function guruStudent(r: Req) {
  await requireUser(r, "guru");
  const rows = await sb("GET", `student_progress?id=eq.${q(String(r.id ?? ""))}&select=*`);
  if (!rows.length) throw new UserError("Siswa tidak ditemukan.");
  const s = progressFromRow(rows[0]);
  if (s.article && rows[0].done_at) (s.article as Row).body = rows[0].body ?? "";
  return s;
}

// ======================= Router =======================

const ACTIONS: Record<string, (r: Req) => Promise<unknown>> = {
  "auth.login": login,
  "auth.register": register,
  "auth.me": async (r) => publicUser(await requireUser(r)),
  "auth.logout": logout,
  "profile.update": updateProfile,
  "data.pull": pullData,
  "article.save": saveArticle,
  "article.delete": deleteArticle,
  "quiz.save": saveQuiz,
  "materi.read": readMateri,
  "chat.send": sendChat,
  "chat.delete": deleteChat,
  "ai.outline": aiOutline,
  "ai.draft": aiDraft,
  "guru.students": guruStudents,
  "guru.student": guruStudent,
};

export async function handle(r: Req): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const fn = ACTIONS[String(r.action)];
    if (!fn) throw new UserError("Aksi tidak dikenal.");
    return { ok: true, data: await fn(r) };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error("[api]", e);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}
