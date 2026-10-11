/**
 * Ideaksi backend: Google Apps Script Web App.
 * Frontend (Vercel) -> POST JSON ke Web App ini -> Supabase (REST) + Gemini.
 *
 * Script Properties yang wajib diisi (Project Settings > Script properties):
 *   SUPABASE_URL          https://<ref>.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role / secret key Supabase (JANGAN dibagikan)
 *   GEMINI_API_KEY        API key Google AI Studio
 * Opsional:
 *   GEMINI_MODEL          default gemini-3.5-flash
 *   GEMINI_FALLBACK       default gemini-3.5-flash-lite (dipakai saat model utama sibuk/kuota habis)
 *
 * Request : POST body (text/plain, supaya tanpa preflight CORS) = {"action": "...", "token": "...", ...}
 * Response: {"ok": true, "data": ...} atau {"ok": false, "error": "pesan untuk pengguna"}
 */

var SESSION_DAYS = 30;
var CHAT_MEMORY = 6; // Dea hanya membawa 6 pesan terakhir dari obrolan yang sama (hemat kuota)
var DAILY_LIMIT = { chat: 40, outline: 10, draft: 10 }; // per siswa per hari
var USERNAME_RULE = /^[a-z0-9_.]{3,20}$/;

// ======================================================================
// Entry point
// ======================================================================

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var handler = ACTIONS[req.action];
    if (!handler) throw userError("Aksi tidak dikenal.");
    out = { ok: true, data: handler(req) };
  } catch (err) {
    out = { ok: false, error: err && err.userMessage ? err.userMessage : "Terjadi kesalahan di server. Coba lagi." };
    if (!(err && err.userMessage)) console.error(err && err.stack ? err.stack : err);
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: "Ideaksi API aktif" }))
    .setMimeType(ContentService.MimeType.JSON);
}

var ACTIONS = {
  "auth.login": login,
  "auth.register": register,
  "auth.me": function (r) { return publicUser(requireUser(r)); },
  "auth.logout": logout,
  "profile.update": updateProfile,
  "data.pull": pullData,
  "article.save": saveArticle,
  "quiz.save": saveQuiz,
  "materi.read": readMateri,
  "chat.send": sendChat,
  "chat.delete": deleteChat,
  "ai.outline": aiOutline,
  "ai.draft": aiDraft,
  "guru.students": guruStudents,
  "guru.student": guruStudent,
};

// Konfigurasi: Script Properties dulu; kalau kosong pakai SECRETS dari Secrets.gs
// (file itu dibuat oleh `node backend/deploy.mjs`, ikut di-upload ke Apps Script, tidak ikut git).
function config(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (v) return v;
  return typeof SECRETS !== "undefined" && SECRETS[key] ? SECRETS[key] : null;
}

function userError(msg) {
  var e = new Error(msg);
  e.userMessage = msg;
  return e;
}

// ======================================================================
// Auth
// ======================================================================

function hashPassword(salt, password) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, "0"); }).join("");
}

function newToken() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
}

function publicUser(u) {
  return { id: u.id, role: u.role, username: u.username, name: u.name, kelas: u.kelas };
}

function startSession(user) {
  var token = newToken();
  var expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  sb("post", "sessions", { token: token, user_id: user.id, expires_at: expires });
  return { token: token, user: publicUser(user) };
}

function login(r) {
  var username = String(r.username || "").trim().toLowerCase();
  var rows = sb("get", "users?username=eq." + encodeURIComponent(username) + "&select=*");
  var u = rows[0];
  if (!u || u.role !== r.role || hashPassword(u.salt, String(r.password || "")) !== u.password_hash) {
    throw userError("Username atau password salah.");
  }
  return startSession(u);
}

function validateProfile(name, username, password, passwordRequired) {
  if (String(name || "").trim().length < 3) throw userError("Nama minimal 3 huruf.");
  if (!USERNAME_RULE.test(username)) throw userError("Username 3–20 karakter: huruf, angka, titik, atau garis bawah.");
  if ((passwordRequired || password) && String(password || "").length < 6) throw userError("Password minimal 6 karakter.");
}

function usernameTaken(username, exceptId) {
  var rows = sb("get", "users?username=eq." + encodeURIComponent(username) + "&select=id");
  return rows.length > 0 && rows[0].id !== exceptId;
}

function register(r) {
  var username = String(r.username || "").trim().toLowerCase();
  validateProfile(r.name, username, r.password, true);
  if (usernameTaken(username)) throw userError("Username sudah dipakai. Coba yang lain.");
  var salt = newToken().slice(0, 32);
  var u = sb("post", "users", {
    role: "siswa", username: username, name: String(r.name).trim(),
    salt: salt, password_hash: hashPassword(salt, String(r.password)),
  })[0];
  return startSession(u);
}

function requireUser(r, role) {
  if (!r.token) throw userError("Sesi berakhir. Silakan masuk lagi.");
  var rows = sb("get", "sessions?token=eq." + encodeURIComponent(r.token) +
    "&expires_at=gt." + encodeURIComponent(new Date().toISOString()) + "&select=user:users(*)");
  var u = rows[0] && rows[0].user;
  if (!u) throw userError("Sesi berakhir. Silakan masuk lagi.");
  if (role && u.role !== role) throw userError("Kamu tidak punya akses ke fitur ini.");
  return u;
}

function logout(r) {
  if (r.token) sb("delete", "sessions?token=eq." + encodeURIComponent(r.token));
  return true;
}

function updateProfile(r) {
  var u = requireUser(r);
  var username = String(r.username || "").trim().toLowerCase();
  validateProfile(r.name, username, r.password, false);
  if (usernameTaken(username, u.id)) throw userError("Username sudah dipakai. Coba yang lain.");
  var patch = { name: String(r.name).trim(), username: username };
  if (r.password) {
    patch.salt = newToken().slice(0, 32);
    patch.password_hash = hashPassword(patch.salt, String(r.password));
  }
  var updated = sb("patch", "users?id=eq." + u.id, patch)[0];
  return publicUser(updated);
}

// ======================================================================
// Data siswa
// ======================================================================

function articleFromRow(a, facts) {
  var out = { id: a.id, stage: a.stage, updated: a.updated_at,
    gen: { outline: a.outline_generated, draft: a.draft_generated } };
  if (a.topic_text) out.topic = { category: a.topic_category || "", text: a.topic_text };
  if (a.question_main) out.question = { main: a.question_main, subs: a.question_subs || [] };
  if (facts && facts.length) out.facts = facts.map(function (f) { return { fact: f.fact, source: f.source }; });
  if (a.outline) out.outline = a.outline;
  if (a.draft_body) out.draft = { title: a.draft_title || "", body: a.draft_body };
  if (a.revision_body) out.revision = { title: a.revision_title || "", body: a.revision_body,
    count: a.revision_count, checks: a.revision_checks || [] };
  if (a.done_at) out.doneAt = a.done_at;
  return out;
}

function pullData(r) {
  var u = requireUser(r, "siswa");
  var arts = sb("get", "articles?user_id=eq." + u.id + "&select=*,facts(fact,source,position)&order=updated_at.desc");
  var quiz = sb("get", "quiz_attempts?user_id=eq." + u.id + "&select=score&order=score.desc&limit=1");
  var reads = sb("get", "materi_reads?user_id=eq." + u.id + "&select=slug");
  var chats = sb("get", "chat_sessions?user_id=eq." + u.id +
    "&select=id,title,updated_at,chat_messages(role,content,id)&order=updated_at.desc&limit=20");
  return {
    user: publicUser(u),
    articles: arts.map(function (a) {
      var facts = (a.facts || []).sort(function (x, y) { return x.position - y.position; });
      return articleFromRow(a, facts);
    }),
    quizBest: quiz.length ? quiz[0].score : null,
    materiRead: reads.map(function (x) { return x.slug; }),
    chats: chats.map(function (c) {
      var msgs = (c.chat_messages || []).sort(function (x, y) { return x.id - y.id; });
      return { id: c.id, title: c.title, updated: c.updated_at,
        messages: msgs.map(function (m) { return { from: m.role === "user" ? "me" : "bot", text: m.content }; }) };
    }),
  };
}

function saveArticle(r) {
  var u = requireUser(r, "siswa");
  var a = r.article || {};
  if (!a.id || String(a.id).length > 64) throw userError("Data artikel tidak valid.");
  var p = {
    id: String(a.id),
    stage: Math.min(6, Math.max(1, Number(a.stage) || 1)),
    topic_category: a.topic ? a.topic.category : null,
    topic_text: a.topic ? a.topic.text : null,
    question_main: a.question ? a.question.main : null,
    question_subs: a.question ? a.question.subs || [] : [],
    outline: a.outline || null,
    outline_generated: (a.gen && a.gen.outline) || 0,
    draft_title: a.draft ? a.draft.title : null,
    draft_body: a.draft ? a.draft.body : null,
    draft_generated: (a.gen && a.gen.draft) || 0,
    revision_title: a.revision ? a.revision.title : null,
    revision_body: a.revision ? a.revision.body : null,
    revision_count: a.revision ? a.revision.count || 0 : 0,
    revision_checks: a.revision ? a.revision.checks || [] : [],
    done_at: a.doneAt || null,
    facts: (a.facts || []).slice(0, 20),
  };
  try {
    sb("post", "rpc/save_article", { p_user: u.id, p: p });
  } catch (err) {
    if (String(err).indexOf("another user") >= 0) throw userError("Artikel ini bukan milikmu.");
    throw err;
  }
  return true;
}

function saveQuiz(r) {
  var u = requireUser(r, "siswa");
  var score = Math.round(Number(r.score));
  if (!(score >= 0 && score <= 100)) throw userError("Skor tidak valid.");
  sb("post", "quiz_attempts", { user_id: u.id, score: score });
  return true;
}

function readMateri(r) {
  var u = requireUser(r, "siswa");
  if (!/^[a-z0-9-]{2,40}$/.test(String(r.slug || ""))) throw userError("Bab tidak valid.");
  sb("post", "materi_reads?on_conflict=user_id,slug", { user_id: u.id, slug: r.slug },
    { Prefer: "resolution=ignore-duplicates,return=minimal" });
  return true;
}

// ======================================================================
// AI (Gemini)
// ======================================================================

function checkLimit(u, kind) {
  var since = new Date();
  since.setHours(0, 0, 0, 0);
  var rows = sb("get", "ai_usage?user_id=eq." + u.id + "&kind=eq." + kind +
    "&created_at=gte." + encodeURIComponent(since.toISOString()) + "&select=id");
  if (rows.length >= DAILY_LIMIT[kind]) {
    throw userError("Batas harian Dea untuk fitur ini sudah habis. Coba lagi besok, ya!");
  }
}

function logUsage(u, kind, tokens) {
  sb("post", "ai_usage", { user_id: u.id, kind: kind, tokens: tokens || 0 }, { Prefer: "return=minimal" });
}

/** Panggil Gemini. json=true => minta output JSON. Mengembalikan {text, tokens}. */
function gemini(system, contents, opts) {
  opts = opts || {};
  var key = config("GEMINI_API_KEY");
  if (!key) throw userError("Dea belum diaktifkan oleh admin (API key Gemini kosong).");
  var models = [config("GEMINI_MODEL") || "gemini-3.5-flash", config("GEMINI_FALLBACK") || "gemini-3.5-flash-lite"];
  var body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: contents,
    generationConfig: {
      temperature: opts.temperature == null ? 0.7 : opts.temperature,
      maxOutputTokens: opts.maxTokens || 800,
      thinkingConfig: { thinkingLevel: "minimal" }, // hemat token, tetap cerdas
    },
  };
  if (opts.json) {
    body.generationConfig.responseMimeType = "application/json";
    if (opts.schema) body.generationConfig.responseSchema = opts.schema;
  }
  var lastErr = "";
  for (var i = 0; i < models.length; i++) {
    var res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + models[i] + ":generateContent", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { "x-goog-api-key": key }, payload: JSON.stringify(body),
    });
    var code = res.getResponseCode();
    var data = JSON.parse(res.getContentText() || "{}");
    if (code === 200) {
      var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      var text = parts.map(function (p) { return p.text || ""; }).join("").trim();
      if (text) return { text: text, tokens: (data.usageMetadata || {}).totalTokenCount || 0 };
      lastErr = "empty";
    } else {
      lastErr = code + " " + ((data.error || {}).message || "");
      // 429/5xx/404 => coba model cadangan; selain itu langsung gagal
      if (!(code === 429 || code >= 500 || code === 404)) break;
    }
  }
  console.error("Gemini gagal: " + lastErr);
  throw userError("Dea sedang sibuk. Coba lagi sebentar lagi, ya.");
}

function articleContext(a) {
  a = a || {};
  var facts = (a.facts || []).map(function (f, i) { return (i + 1) + ". " + f.fact + " (Sumber: " + f.source + ")"; });
  return [
    "Topik: " + ((a.topic && a.topic.text) || "-"),
    "Pertanyaan utama: " + ((a.question && a.question.main) || "-"),
    "Sub-pertanyaan: " + (((a.question && a.question.subs) || []).join("; ") || "-"),
    "Fakta dan sumber:\n" + (facts.join("\n") || "-"),
  ].join("\n");
}

var WRITER_RULES =
  "Kamu membantu siswa kelas VIII SMP menulis artikel ilmiah populer berbahasa Indonesia. " +
  "Gunakan bahasa Indonesia baku yang sederhana dan mudah dipahami anak SMP. " +
  "HANYA gunakan fakta yang diberikan siswa; JANGAN mengarang angka, data, atau sumber baru. " +
  "Sebut sumber di dalam kalimat, misalnya \"Menurut BPS (2024), ...\". Tidak ada daftar pustaka. " +
  "Tulis teks biasa tanpa format Markdown.";

function aiOutline(r) {
  var u = requireUser(r, "siswa");
  checkLimit(u, "outline");
  var res = gemini(WRITER_RULES + " Tugasmu: susun KERANGKA artikel (bukan artikel jadi).", [{
    role: "user",
    parts: [{ text: articleContext(r.article) +
      "\n\nBuat kerangka 3 bagian. pendahuluan: 2-3 kalimat arahan isi pendahuluan. " +
      "isi: satu poin per baris, diawali nomor, tiap poin memakai satu fakta di atas beserta sumbernya. " +
      "penutup: 1-2 kalimat arahan kesimpulan dan saran." }],
  }], {
    json: true, maxTokens: 900, temperature: 0.5,
    schema: { type: "OBJECT", properties: { pendahuluan: { type: "STRING" }, isi: { type: "STRING" }, penutup: { type: "STRING" } },
      required: ["pendahuluan", "isi", "penutup"] },
  });
  logUsage(u, "outline", res.tokens);
  return parseJson(res.text, ["pendahuluan", "isi", "penutup"]);
}

function aiDraft(r) {
  var u = requireUser(r, "siswa");
  checkLimit(u, "draft");
  var a = r.article || {};
  var o = a.outline || {};
  var res = gemini(WRITER_RULES + " Tugasmu: tulis DRAFT artikel ilmiah populer lengkap beserta judul.", [{
    role: "user",
    parts: [{ text: articleContext(a) +
      "\n\nKerangka dari siswa:\nPendahuluan: " + (o.pendahuluan || "-") + "\nIsi:\n" + (o.isi || "-") + "\nPenutup: " + (o.penutup || "-") +
      "\n\nTulis artikel sekitar 300-400 kata (jangan kurang dari 280 kata) dengan 5-6 paragraf: paragraf pertama pendahuluan, paragraf terakhir penutup, sisanya isi. " +
      "Pisahkan paragraf dengan satu baris kosong. Judul menarik, maksimal 12 kata. " +
      (r.variant ? "Buat versi yang berbeda dari sebelumnya (variasi ke-" + (Number(r.variant) + 1) + "). " : "") }],
  }], {
    json: true, maxTokens: 1600, temperature: 0.8,
    schema: { type: "OBJECT", properties: { title: { type: "STRING" }, body: { type: "STRING" } }, required: ["title", "body"] },
  });
  logUsage(u, "draft", res.tokens);
  var d = parseJson(res.text, ["title", "body"]);
  d.body = d.body.replace(/\r/g, "").replace(/\n(?!\n)/g, "\n\n").replace(/\n{3,}/g, "\n\n").trim();
  return d;
}

function parseJson(text, keys) {
  var obj;
  try {
    obj = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch (e) {
    throw userError("Dea gagal menyusun jawaban. Coba sekali lagi, ya.");
  }
  keys.forEach(function (k) {
    if (typeof obj[k] !== "string" || !obj[k].trim()) throw userError("Dea gagal menyusun jawaban. Coba sekali lagi, ya.");
    obj[k] = obj[k].trim();
  });
  return obj;
}

var DEA_SYSTEM =
  "Kamu adalah \"Dea\", asisten pendamping menulis artikel ilmiah populer untuk siswa kelas VIII SMP (Bahasa Indonesia).\n" +
  "ATURAN:\n" +
  "1. Hanya bantu seputar penulisan artikel ilmiah populer: topik, pertanyaan, fakta & sumber, kerangka, judul, pendahuluan, isi, penutup, ejaan, dan revisi.\n" +
  "2. Bahasa Indonesia yang ramah, singkat (maksimal sekitar 120 kata), mudah dipahami anak SMP. Boleh satu emoji.\n" +
  "3. Jika di luar konteks, tolak dengan sopan: \"Maaf, aku hanya bisa membantu seputar penulisan artikel ilmiah populer ya! 😊\"\n" +
  "4. JANGAN menuliskan seluruh artikel untuk siswa. Bantu siswa berpikir: beri arahan, contoh singkat, dan pertanyaan pancingan.\n" +
  "5. Jangan mengarang data atau sumber. Sarankan mencari di sumber tepercaya (situs pemerintah, lembaga resmi, buku).\n" +
  "6. Tulis teks biasa tanpa format Markdown (tanpa *, #, atau **). Untuk daftar, pakai angka 1. 2. 3. di baris baru.";

function sendChat(r) {
  var u = requireUser(r, "siswa");
  var text = String(r.message || "").trim().slice(0, 1000);
  if (!text) throw userError("Pesan kosong.");
  var sid = String(r.sessionId || "");
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(sid)) throw userError("Sesi obrolan tidak valid.");
  checkLimit(u, "chat");

  var own = sb("get", "chat_sessions?id=eq." + encodeURIComponent(sid) + "&select=user_id");
  if (own.length && own[0].user_id !== u.id) throw userError("Obrolan ini bukan milikmu.");
  if (!own.length) sb("post", "chat_sessions", { id: sid, user_id: u.id, title: text.slice(0, 80) }, { Prefer: "return=minimal" });

  // memori pendek: hanya beberapa pesan terakhir di obrolan ini
  var history = sb("get", "chat_messages?session_id=eq." + encodeURIComponent(sid) +
    "&select=role,content&order=id.desc&limit=" + CHAT_MEMORY).reverse();
  var contents = history.map(function (m) {
    return { role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] };
  });
  var c = r.context || {};
  var ctx = "[Konteks siswa] Tahap: " + (c.stage || "-") + " | Topik: " + (c.topic || "-") +
    " | Pertanyaan utama: " + (c.question || "-") + "\n\n";
  contents.push({ role: "user", parts: [{ text: ctx + text }] });

  var res = gemini(DEA_SYSTEM, contents, { maxTokens: 500, temperature: 0.7 });
  sb("post", "chat_messages", [
    { session_id: sid, role: "user", content: text },
    { session_id: sid, role: "dea", content: res.text },
  ], { Prefer: "return=minimal" });
  // sentuh updated_at supaya obrolan ini naik ke atas riwayat
  sb("patch", "chat_sessions?id=eq." + encodeURIComponent(sid), { updated_at: new Date().toISOString() },
    { Prefer: "return=minimal" });
  logUsage(u, "chat", res.tokens);
  return { reply: res.text };
}

function deleteChat(r) {
  var u = requireUser(r, "siswa");
  sb("delete", "chat_sessions?id=eq." + encodeURIComponent(String(r.sessionId || "")) + "&user_id=eq." + u.id);
  return true;
}

// ======================================================================
// Guru
// ======================================================================

function progressFromRow(s) {
  var done = !!s.done_at;
  return {
    id: s.id, username: s.username, name: s.name, kelas: s.kelas,
    stage: done ? 7 : s.stage || 0, // 0 = belum mulai, 7 = selesai (sama dengan frontend)
    quiz: s.quiz_best, materi: s.materi_read, updated: s.last_active,
    article: s.article_id ? {
      title: s.title || "", topic: s.topic_text || "", question: s.question_main || "",
      facts: s.facts, outlineGenerated: s.outline_generated, draftGenerated: s.draft_generated,
      revisions: s.revision_count, words: s.body ? s.body.trim().split(/\s+/).length : 0,
    } : undefined,
  };
}

function guruStudents(r) {
  requireUser(r, "guru");
  var rows = sb("get", "student_progress?select=id,username,name,kelas,last_active,quiz_best,materi_read,article_id,stage,done_at,topic_text,question_main,title,facts,outline_generated,draft_generated,revision_count,body&order=name.asc");
  return rows.map(progressFromRow);
}

function guruStudent(r) {
  requireUser(r, "guru");
  var rows = sb("get", "student_progress?id=eq." + encodeURIComponent(String(r.id || "")) + "&select=*");
  if (!rows.length) throw userError("Siswa tidak ditemukan.");
  var s = progressFromRow(rows[0]);
  if (s.article && rows[0].done_at) s.article.body = rows[0].body || "";
  return s;
}

// ======================================================================
// Supabase REST
// ======================================================================

function sb(method, path, body, extraHeaders) {
  var url = config("SUPABASE_URL");
  var key = config("SUPABASE_SERVICE_KEY");
  if (!url || !key) throw userError("Server belum dikonfigurasi (Supabase).");
  var headers = { apikey: key, Authorization: "Bearer " + key, Prefer: "return=representation" };
  if (extraHeaders) Object.keys(extraHeaders).forEach(function (k) { headers[k] = extraHeaders[k]; });
  var opts = { method: method, headers: headers, muteHttpExceptions: true, contentType: "application/json" };
  if (body !== undefined) opts.payload = JSON.stringify(body);
  var res = UrlFetchApp.fetch(url.replace(/\/$/, "") + "/rest/v1/" + path, opts);
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code >= 300) throw new Error("Supabase " + method + " " + path.split("?")[0] + " " + code + ": " + text);
  return text ? JSON.parse(text) : null;
}
