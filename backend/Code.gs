/**
 * Ideaksi AI service: Google Apps Script Web App.
 * HANYA untuk AI (Gemini). Login, data, dan Supabase ditangani backend Vercel (src/app/api/route.ts),
 * yang memanggil Web App ini dengan secret bersama.
 *
 * Konfigurasi (Script Properties, atau Secrets.gs yang dibuat backend/deploy.mjs):
 *   GEMINI_API_KEY   API key Google AI Studio
 *   AI_SECRET        rahasia bersama dengan Vercel (env AI_SECRET)
 *   GEMINI_MODEL     opsional, default gemini-3.5-flash
 *   GEMINI_FALLBACK  opsional, default gemini-3.5-flash-lite
 *
 * Request : POST {"secret": "...", "task": "outline" | "draft" | "chat", ...}
 * Response: {"ok": true, "data": {..., "tokens": n}} atau {"ok": false, "error": "..."}
 */

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var secret = config("AI_SECRET");
    if (!secret || req.secret !== secret) throw userError("Akses ditolak.");
    var task = TASKS[req.task];
    if (!task) throw userError("Tugas AI tidak dikenal.");
    out = { ok: true, data: task(req) };
  } catch (err) {
    out = { ok: false, error: err && err.userMessage ? err.userMessage : "Dea sedang bermasalah. Coba lagi." };
    if (!(err && err.userMessage)) console.error(err && err.stack ? err.stack : err);
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: "Ideaksi AI aktif" }))
    .setMimeType(ContentService.MimeType.JSON);
}

var TASKS = { outline: aiOutline, draft: aiDraft, chat: aiChat };

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
  var o = parseJson(res.text, ["pendahuluan", "isi", "penutup"]);
  o.tokens = res.tokens;
  return o;
}

function aiDraft(r) {
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
  var d = parseJson(res.text, ["title", "body"]);
  d.body = d.body.replace(/\r/g, "").replace(/\n(?!\n)/g, "\n\n").replace(/\n{3,}/g, "\n\n").trim();
  d.tokens = res.tokens;
  return d;
}

/** r.history = [{role: "user"|"dea", content}] (beberapa pesan terakhir), r.message, r.context */
function aiChat(r) {
  var contents = (r.history || []).slice(-6).map(function (m) {
    return { role: m.role === "user" ? "user" : "model", parts: [{ text: String(m.content) }] };
  });
  var c = r.context || {};
  var ctx = "[Konteks siswa] Tahap: " + (c.stage || "-") + " | Topik: " + (c.topic || "-") +
    " | Pertanyaan utama: " + (c.question || "-") + "\n\n";
  contents.push({ role: "user", parts: [{ text: ctx + String(r.message || "").slice(0, 1000) }] });
  var res = gemini(DEA_SYSTEM, contents, { maxTokens: 500, temperature: 0.7 });
  return { reply: res.text, tokens: res.tokens };
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
