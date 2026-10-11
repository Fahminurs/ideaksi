# Backend Ideaksi

```
Browser ──▶ Vercel /api (src/server/api.ts) ──▶ Supabase (login, artikel, kuis, materi, chat, guru)
                     └──secret──▶ Apps Script (backend/Code.gs) ──▶ Gemini   (khusus AI)
```

- **Vercel `/api`**: semua data & login. Env server: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `AI_URL`, `AI_SECRET`.
- **Apps Script**: hanya memanggil Gemini (`outline`, `draft`, `chat`), dilindungi `AI_SECRET`. Kunci di `Secrets.gs` (dibuat `deploy.mjs`, tidak ikut git).
- **Supabase**: `supabase/schema.sql` + `supabase/seed.sql`, ERD di `docs/ERD.md`.

## Perintah

```bash
node backend/deploy.mjs                                          # upload + redeploy Apps Script (butuh clasp login)
API_URL=https://ideaksi.vercel.app/api node backend/test/run.mjs # uji semua aksi (26 langkah)
API_URL=... node backend/test/run.mjs --no-ai                    # tanpa memakai kuota Gemini
```

Butuh `backend/.env.test` (lihat `backend/.env.example`).

## Hemat kuota

`gemini-3.5-flash` (thinking minimal), cadangan `gemini-3.5-flash-lite`. Batas harian per siswa: 40 chat, 10 kerangka, 10 draft. Memori Dea: 6 pesan terakhir obrolan yang sama.
