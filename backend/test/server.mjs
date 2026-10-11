// Server lokal yang menjalankan Code.gs persis seperti Web App Apps Script, untuk uji frontend.
// Jalankan: node backend/test/server.mjs   lalu set NEXT_PUBLIC_API_URL=http://localhost:8787 di .env.local
import { createServer } from "node:http";
import { loadEnv, loadGas } from "./gas.mjs";

const api = loadGas(loadEnv());
const PORT = Number(process.env.PORT || 8787);

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.end(JSON.stringify({ ok: true, data: "Ideaksi API lokal aktif" }));
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let parsed = {};
    try {
      parsed = JSON.parse(body || "{}");
    } catch {}
    const out = api.call(parsed);
    console.log(new Date().toLocaleTimeString(), parsed.action, out.ok ? "ok" : "ERR " + out.error);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(out));
  });
}).listen(PORT, () => console.log(`Ideaksi API lokal: http://localhost:${PORT}`));
