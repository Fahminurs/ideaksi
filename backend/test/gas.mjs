// Menjalankan backend/Code.gs di Node dengan tiruan layanan Apps Script (UrlFetchApp, Utilities, dll).
// UrlFetchApp di Apps Script bersifat sinkron, jadi di sini memakai curl lewat execFileSync.
// Kunci dibaca dari backend/.env.test (tidak ikut git), format KEY=value per baris.
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const here = new URL(".", import.meta.url);

export function loadEnv() {
  const file = new URL("../.env.test", here);
  if (!existsSync(file)) throw new Error("backend/.env.test belum ada (lihat backend/README.md)");
  return Object.fromEntries(
    readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

function fetchSync(url, opts = {}) {
  const args = ["-s", "-S", "-X", (opts.method || "get").toUpperCase(), url, "-w", "\n%{http_code}"];
  for (const [k, v] of Object.entries(opts.headers || {})) args.push("-H", `${k}: ${v}`);
  if (opts.contentType) args.push("-H", `Content-Type: ${opts.contentType}`);
  if (opts.payload !== undefined) args.push("--data-binary", "@-");
  const out = execFileSync("curl", args, { input: opts.payload ?? "", maxBuffer: 20e6 }).toString("utf8");
  const i = out.lastIndexOf("\n");
  const body = out.slice(0, i);
  const code = Number(out.slice(i + 1));
  return { getResponseCode: () => code, getContentText: () => body };
}

export function loadGas(props) {
  const ctx = {
    console,
    UrlFetchApp: { fetch: fetchSync },
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" },
      Charset: { UTF_8: "utf8" },
      computeDigest: (alg, text) => [...createHash(alg).update(text, "utf8").digest()].map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => randomUUID(),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (content) => ({ content, setMimeType() { return this; } }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("../Code.gs", here), "utf8"), ctx, { filename: "Code.gs" });
  return {
    call: (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).content),
  };
}

// Klien untuk Web App yang sudah dideploy (uji sungguhan lewat internet).
export function loadRemote(url) {
  return {
    call: (body) => {
      // Apps Script membalas POST dengan redirect 302; tanpa -X, curl -L mengikutinya sebagai GET (perilaku yang benar)
      const out = execFileSync("curl", ["-s", "-L", url, "-H", "Content-Type: text/plain", "--data-binary", "@-"],
        { input: JSON.stringify(body), maxBuffer: 20e6 }).toString("utf8");
      try {
        return JSON.parse(out);
      } catch {
        throw new Error("Respons bukan JSON: " + out.slice(0, 300));
      }
    },
  };
}
