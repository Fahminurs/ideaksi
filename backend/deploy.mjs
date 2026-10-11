// Upload & deploy backend ke Google Apps Script memakai clasp.
// Sekali saja sebelumnya: aktifkan Apps Script API (script.google.com/home/usersettings) lalu `npx @google/clasp login`.
// Jalankan: node backend/deploy.mjs
//   1. Membuat project "Ideaksi API" (kalau belum ada)
//   2. Menyalin Code.gs + appsscript.json + Secrets.gs (dari backend/.env.test) ke backend/dist lalu `clasp push`
//   3. Membuat / memperbarui deployment Web App (URL tetap sama) dan menulis NEXT_PUBLIC_API_URL ke .env.local
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "./test/gas.mjs";

const dir = new URL(".", import.meta.url);
const path = (p) => new URL(p, dir);
const clasp = (...args) =>
  execFileSync("npx", ["-y", "@google/clasp", ...args], { cwd: dir, encoding: "utf8", shell: true });

// 1. project
if (!existsSync(path(".clasp.json"))) {
  console.log("Membuat project Apps Script...");
  mkdirSync(path("dist"), { recursive: true });
  console.log(clasp("create-script", "--type", "standalone", "--title", '"Ideaksi API"', "--rootDir", "dist"));
}

// 2. file yang diunggah
mkdirSync(path("dist"), { recursive: true });
copyFileSync(path("Code.gs"), path("dist/Code.gs"));
copyFileSync(path("appsscript.json"), path("dist/appsscript.json"));
const env = loadEnv();
const keys = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "GEMINI_API_KEY", "GEMINI_MODEL", "GEMINI_FALLBACK"];
const secrets = Object.fromEntries(keys.filter((k) => env[k]).map((k) => [k, env[k]]));
writeFileSync(path("dist/Secrets.gs"),
  "// Dibuat otomatis oleh backend/deploy.mjs. Script Properties (kalau diisi) lebih diutamakan.\n" +
  `var SECRETS = ${JSON.stringify(secrets, null, 2)};\n`);
console.log("Upload kode...");
console.log(clasp("push", "--force"));

// 3. deployment web app
const depFile = path(".deployment.json");
let id = existsSync(depFile) ? JSON.parse(readFileSync(depFile, "utf8")).deploymentId : null;
const desc = `"Ideaksi ${new Date().toISOString().slice(0, 16)}"`;
if (id) {
  console.log(clasp("update-deployment", id, "--description", desc));
} else {
  const out = clasp("create-deployment", "--description", desc);
  id = out.match(/AKfy[\w-]+/)?.[0];
  if (!id) throw new Error("Tidak menemukan deploymentId di keluaran clasp:\n" + out);
  writeFileSync(depFile, JSON.stringify({ deploymentId: id }, null, 2));
}

const url = `https://script.google.com/macros/s/${id}/exec`;
const envLocal = new URL("../.env.local", dir);
const prev = existsSync(envLocal) ? readFileSync(envLocal, "utf8").replace(/^NEXT_PUBLIC_API_URL=.*\n?/m, "") : "";
writeFileSync(envLocal, `${prev}NEXT_PUBLIC_API_URL=${url}\n`);
console.log("\nWeb App URL:", url, "\n(ditulis ke .env.local)");
