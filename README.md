# Ideaksi

Aplikasi belajar menulis **artikel ilmiah populer** untuk siswa kelas VIII SMP: 6 tahap menulis (topik → pertanyaan → fakta & sumber → kerangka → draft → revisi & PDF), materi, contoh artikel beranotasi, kuis, asisten AI **Tanya Dea**, dan dashboard guru.

Dibuat oleh **Nur Isna Sabrina** untuk memenuhi Tugas Akhir PPG.

## Arsitektur (semua gratis)

| Bagian | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router) di **Vercel** |
| Backend | **Google Apps Script** Web App — [`backend/`](backend/README.md) |
| Database | **Supabase** Postgres — [`supabase/`](supabase/), ERD di [`docs/ERD.md`](docs/ERD.md) |
| AI | **Gemini** (`gemini-3.5-flash`, cadangan `gemini-3.5-flash-lite`) |

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Tanpa `.env.local`, aplikasi berjalan dalam **mode lokal** (akun demo: `aisyah`/`siswa123`, `guru`/`guru123`).
Untuk memakai backend sungguhan, salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_API_URL` (lihat [`backend/README.md`](backend/README.md)).

## Deploy ke Vercel

1. Import repo ini di <https://vercel.com/new> (login dengan GitHub).
2. Tambahkan Environment Variable `NEXT_PUBLIC_API_URL` = URL Web App Apps Script.
3. Deploy. Setiap `git push` ke `main` otomatis ter-deploy ulang.

Sebelum rilis, hapus tombol pintas DEV: `src/components/DevLogin.tsx`, `<DevLogin />` di `src/app/layout.tsx`, dan `devLogin()` di `src/lib/session.ts` (tombol ini hanya muncul saat `npm run dev`).
