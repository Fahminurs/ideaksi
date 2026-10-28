# Ideaksi

Aplikasi belajar menulis **artikel ilmiah populer** untuk siswa kelas VIII SMP: 6 tahap menulis (topik → pertanyaan → fakta & sumber → kerangka → draft → revisi & PDF), materi, contoh artikel beranotasi, kuis, asisten AI **Tanya Dea**, dan dashboard guru.

Konsep oleh **Nur Isna Sabrina** untuk memenuhi Tugas Akhir PPG. Dikembangkan oleh **Fahmi Nursafaat** (developer).

## Arsitektur (semua gratis)

| Bagian | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router) di **Vercel** |
| Backend data | **Vercel** Route Handler `/api` (JS) — [`src/server/api.ts`](src/server/api.ts) |
| Backend AI | **Google Apps Script** Web App, khusus Gemini — [`backend/`](backend/README.md) |
| Database | **Supabase** Postgres — [`supabase/`](supabase/), ERD di [`docs/ERD.md`](docs/ERD.md) |
| AI | **Gemini** (`gemini-3.5-flash`, cadangan `gemini-3.5-flash-lite`) |

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Tanpa `.env.local`, aplikasi berjalan dalam **mode lokal** (akun demo: `aisyah`/`siswa123`, `guru`/`guru123`).
Untuk memakai backend sungguhan, salin `.env.example` menjadi `.env.local` dan isi semua nilainya.

## Deploy ke Vercel

Sudah terpasang di <https://ideaksi.vercel.app>. Env di Vercel: `NEXT_PUBLIC_API_URL=/api`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `AI_URL`, `AI_SECRET`.
Deploy manual: `npx vercel deploy --prod` (auto-deploy saat push butuh Vercel GitHub App di repo ini).

Sebelum rilis, hapus tombol pintas DEV: `src/components/DevLogin.tsx`, `<DevLogin />` di `src/app/layout.tsx`, dan `devLogin()` di `src/lib/session.ts` (tombol ini hanya muncul saat `npm run dev`).
