// Uji backend end-to-end terhadap Supabase & Gemini sungguhan.
// Jalankan: API_URL=https://ideaksi.vercel.app/api node backend/test/run.mjs   (butuh backend/.env.test)
// Membuat akun uji sementara lalu menghapusnya di akhir.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { loadEnv, loadRemote } from "./gas.mjs";

const env = loadEnv();
// API_URL = endpoint /api Next.js (lokal atau Vercel). AI di baliknya memanggil Apps Script.
const API_URL = process.env.API_URL || "http://localhost:3000/api";
const api = loadRemote(API_URL);
console.log(`Menguji API: ${API_URL}`);
const skipAi = process.argv.includes("--no-ai");
let passed = 0;

function step(name, fn) {
  const t = Date.now();
  try {
    const out = fn();
    passed++;
    console.log(`  ok  ${name} (${Date.now() - t} ms)`);
    return out;
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${e.message}`);
    process.exitCode = 1;
    throw e;
  }
}

const ok = (res) => {
  assert.equal(res.ok, true, `harus ok, dapat: ${res.error}`);
  return res.data;
};
const fail = (res, re) => {
  assert.equal(res.ok, false, "harus gagal");
  assert.match(res.error, re);
};

function rest(method, path) {
  return execFileSync("curl", ["-s", "-X", method, `${env.SUPABASE_URL}/rest/v1/${path}`,
    "-H", `apikey: ${env.SUPABASE_SERVICE_KEY}`, "-H", `Authorization: Bearer ${env.SUPABASE_SERVICE_KEY}`]).toString();
}

const uname = "tes_" + Date.now().toString(36);
let token, guruToken;
const articleId = randomUUID();
const chatId = "c" + Date.now().toString(36);

try {
  console.log("Keamanan");
  step("kunci anon tidak bisa membaca tabel users", () => {
    const out = execFileSync("curl", ["-s", `${env.SUPABASE_URL}/rest/v1/users?select=username`,
      "-H", `apikey: ${env.SUPABASE_ANON_KEY}`, "-H", `Authorization: Bearer ${env.SUPABASE_ANON_KEY}`]).toString();
    assert.equal(out.trim(), "[]");
  });
  step("aksi tanpa token ditolak", () => fail(api.call({ action: "data.pull" }), /Sesi berakhir/));
  step("aksi tak dikenal ditolak", () => fail(api.call({ action: "hapus.semua" }), /tidak dikenal/));

  console.log("Akun");
  step("login akun demo aisyah", () => {
    const d = ok(api.call({ action: "auth.login", role: "siswa", username: "aisyah", password: "siswa123" }));
    assert.equal(d.user.name, "Aisyah Rahmawati");
  });
  step("login password salah ditolak", () =>
    fail(api.call({ action: "auth.login", role: "siswa", username: "aisyah", password: "salah" }), /salah/));
  step("login siswa lewat tab guru ditolak", () =>
    fail(api.call({ action: "auth.login", role: "guru", username: "aisyah", password: "siswa123" }), /salah/));
  step("daftar akun baru", () => {
    const d = ok(api.call({ action: "auth.register", name: "Siswa Uji", username: uname, password: "rahasia1" }));
    token = d.token;
    assert.equal(d.user.role, "siswa");
  });
  step("username dobel ditolak", () =>
    fail(api.call({ action: "auth.register", name: "Lain", username: uname, password: "rahasia1" }), /sudah dipakai/));
  step("password pendek ditolak", () =>
    fail(api.call({ action: "auth.register", name: "Lain", username: uname + "x", password: "123" }), /minimal 6/));
  step("auth.me", () => assert.equal(ok(api.call({ action: "auth.me", token })).username, uname));
  step("ubah profil (nama + password)", () => {
    const d = ok(api.call({ action: "profile.update", token, name: "Siswa Uji Dua", username: uname, password: "baru1234" }));
    assert.equal(d.name, "Siswa Uji Dua");
    ok(api.call({ action: "auth.login", role: "siswa", username: uname, password: "baru1234" }));
  });

  console.log("Data siswa");
  const article = {
    id: articleId, stage: 3,
    topic: { category: "kesehatan", text: "Manfaat tidur cukup bagi pelajar" },
    question: { main: "Bagaimana tidur cukup membantu konsentrasi belajar pelajar?", subs: ["Berapa jam tidur ideal remaja?"] },
    facts: [
      { fact: "Remaja membutuhkan tidur 8 sampai 10 jam setiap malam.", source: "Kementerian Kesehatan, 2023" },
      { fact: "Kurang tidur membuat konsentrasi menurun di sekolah.", source: "WHO, 2022" },
      { fact: "Tidur cukup membantu otak menyimpan ingatan pelajaran.", source: "UNICEF, 2024" },
    ],
  };
  step("simpan artikel + fakta", () => ok(api.call({ action: "article.save", token, article })));
  step("simpan kuis & materi", () => {
    ok(api.call({ action: "quiz.save", token, score: 70 }));
    ok(api.call({ action: "quiz.save", token, score: 90 }));
    ok(api.call({ action: "materi.read", token, slug: "pengertian" }));
    ok(api.call({ action: "materi.read", token, slug: "pengertian" })); // dobel diabaikan
  });
  step("skor kuis tidak valid ditolak", () => fail(api.call({ action: "quiz.save", token, score: 150 }), /tidak valid/));
  step("data.pull mengembalikan semuanya", () => {
    const d = ok(api.call({ action: "data.pull", token }));
    assert.equal(d.articles.length, 1);
    assert.equal(d.articles[0].facts.length, 3);
    assert.equal(d.articles[0].question.subs[0], "Berapa jam tidur ideal remaja?");
    assert.equal(d.quizBest, 90);
    assert.deepEqual(d.materiRead, ["pengertian"]);
  });
  step("tidak bisa menimpa artikel siswa lain", () => {
    const other = ok(api.call({ action: "auth.login", role: "siswa", username: "budi", password: "siswa123" }));
    fail(api.call({ action: "article.save", token: other.token, article: { ...article, stage: 1 } }), /bukan milikmu/);
    ok(api.call({ action: "auth.logout", token: other.token }));
  });

  if (!skipAi) {
    console.log("AI (Gemini)");
    const outline = step("ai.outline", () => {
      const d = ok(api.call({ action: "ai.outline", token, article }));
      assert.ok(d.pendahuluan.length > 20 && d.isi.length > 20 && d.penutup.length > 10);
      console.log("      isi:", d.isi.split("\n")[0].slice(0, 90));
      return d;
    });
    step("ai.draft", () => {
      const d = ok(api.call({ action: "ai.draft", token, article: { ...article, outline } }));
      const paras = d.body.split(/\n\n/);
      assert.ok(paras.length >= 3, "minimal 3 paragraf");
      assert.ok(d.title.length > 5);
      console.log("      judul:", d.title, `| ${d.body.split(/\s+/).length} kata, ${paras.length} paragraf`);
    });
    step("chat.send + memori", () => {
      const ctx = { stage: "Fakta & sumber", topic: article.topic.text, question: article.question.main };
      const a = ok(api.call({ action: "chat.send", token, sessionId: chatId, message: "Namaku Rara. Apa itu fakta?", context: ctx }));
      assert.ok(a.reply.length > 10);
      const b = ok(api.call({ action: "chat.send", token, sessionId: chatId, message: "Siapa namaku tadi?", context: ctx }));
      assert.match(b.reply, /Rara/i, "Dea harus ingat isi obrolan yang sama");
      console.log("      Dea:", b.reply.slice(0, 100).replace(/\n/g, " "));
    });
    step("chat di luar topik ditolak sopan", () => {
      const d = ok(api.call({ action: "chat.send", token, sessionId: chatId + "x", message: "Rekomendasikan game seru dong" }));
      assert.match(d.reply, /maaf|hanya|artikel/i);
    });
    step("riwayat chat tersimpan", () => {
      const d = ok(api.call({ action: "data.pull", token }));
      const c = d.chats.find((x) => x.id === chatId);
      assert.equal(c.messages.length, 4);
    });
    step("hapus obrolan", () => ok(api.call({ action: "chat.delete", token, sessionId: chatId + "x" })));
  }

  console.log("Guru");
  step("siswa tidak bisa membuka data guru", () => fail(api.call({ action: "guru.students", token }), /tidak punya akses/));
  step("guru melihat daftar siswa", () => {
    guruToken = ok(api.call({ action: "auth.login", role: "guru", username: "guru", password: "guru123" })).token;
    const list = ok(api.call({ action: "guru.students", token: guruToken }));
    const me = list.find((s) => s.username === uname);
    assert.equal(me.stage, 3);
    assert.equal(me.quiz, 90);
    assert.equal(me.article.facts, 3);
    assert.ok(list.length >= 11);
  });
  step("guru melihat detail siswa selesai", () => {
    const list = ok(api.call({ action: "guru.students", token: guruToken }));
    const aisyah = list.find((s) => s.username === "aisyah");
    const d = ok(api.call({ action: "guru.student", token: guruToken, id: aisyah.id }));
    assert.equal(d.stage, 7);
    assert.ok(d.article.body.length > 100);
  });
  step("logout mematikan token", () => {
    ok(api.call({ action: "auth.logout", token: guruToken }));
    fail(api.call({ action: "auth.me", token: guruToken }), /Sesi berakhir/);
  });
} finally {
  // bersihkan akun uji (artikel, chat, dll ikut terhapus lewat ON DELETE CASCADE)
  rest("DELETE", `users?username=eq.${uname}`);
  console.log(`\n${passed} langkah lulus${process.exitCode ? ", ada yang GAGAL" : ""}.`);
}
