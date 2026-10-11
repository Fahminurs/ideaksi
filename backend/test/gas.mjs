// Utilitas uji: baca backend/.env.test (tidak ikut git) dan klien HTTP sinkron (curl) ke API.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const here = new URL(".", import.meta.url);

export function loadEnv() {
  const file = new URL("../.env.test", here);
  if (!existsSync(file)) throw new Error("backend/.env.test belum ada (lihat backend/README.md)");
  return Object.fromEntries(
    readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

// Klien ke endpoint API (lokal/Vercel/Apps Script).
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
