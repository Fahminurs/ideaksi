# Backend Ideaksi (Google Apps Script)

Semua gratis: **Vercel** (frontend) → **Google Apps Script** (backend, file `Code.gs`) → **Supabase** (database) + **Gemini** (AI).

```
Browser ──POST JSON──▶ Apps Script Web App ──REST──▶ Supabase (Postgres)
                                   └────────────────▶ Gemini API
```

Kunci rahasia (Supabase service key, Gemini API key) **hanya** disimpan di Script Properties Apps Script, tidak pernah di frontend.

## 1. Database Supabase (sudah dibuat)

Tabel sudah dibuat di project Supabase **PPG-UAS** dari `supabase/schema.sql` dan diisi `supabase/seed.sql`.
ERD: [`docs/ERD.md`](../docs/ERD.md). Kalau perlu membuat ulang di project lain, jalankan kedua file itu di Supabase → SQL Editor.

Akun demo: siswa `aisyah` / `siswa123`, guru `guru` / `guru123` (plus 9 siswa contoh, password `siswa123`).

## 2. Pasang di Google Apps Script (±5 menit)

1. Buka <https://script.google.com> → **New project**, beri nama `Ideaksi API`.
2. Hapus isi `Code.gs`, lalu tempel seluruh isi [`backend/Code.gs`](Code.gs).
3. **Project Settings** (ikon gerigi) → centang *Show "appsscript.json" manifest file* → buka `appsscript.json` di editor, ganti isinya dengan [`backend/appsscript.json`](appsscript.json).
4. **Project Settings → Script Properties → Add script property**, isi:

   | Property | Nilai |
   |---|---|
   | `SUPABASE_URL` | `https://ylkzmfdfqfyxfwehonol.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API Keys → **secret** key |
   | `GEMINI_API_KEY` | API key dari <https://aistudio.google.com/apikey> |
   | `GEMINI_MODEL` *(opsional)* | default `gemini-3.5-flash` |
   | `GEMINI_FALLBACK` *(opsional)* | default `gemini-3.5-flash-lite` |

   Nilai yang dipakai saat pengujian ada di `backend/.env.test` (file lokal, tidak ikut git).
5. **Deploy → New deployment** → tipe **Web app** → *Execute as*: **Me**, *Who has access*: **Anyone** → **Deploy** → izinkan akses (Authorize).
6. Salin **Web app URL** (berakhiran `/exec`).

Setiap kali `Code.gs` diubah: **Deploy → Manage deployments → edit (pensil) → Version: New version → Deploy** (URL tetap sama).

## 3. Sambungkan frontend

- Lokal: buat `.env.local` di root project berisi `NEXT_PUBLIC_API_URL=<Web app URL>`, lalu jalankan ulang `npm run dev`.
- Vercel: Project → Settings → Environment Variables → `NEXT_PUBLIC_API_URL` = Web app URL → **Redeploy**.

Tanpa `NEXT_PUBLIC_API_URL`, aplikasi tetap jalan dalam **mode lokal** (akun demo & data di browser, Dea memakai jawaban contoh).

## Hemat kuota (gratis)

- Model `gemini-3.5-flash` dengan *thinking* minimal; otomatis pindah ke `gemini-3.5-flash-lite` kalau model utama sibuk/kuota habis.
- Batas harian per siswa: 40 chat, 10 kerangka, 10 draft (`DAILY_LIMIT` di `Code.gs`).
- Memori Tanya Dea: hanya 6 pesan terakhir dari obrolan yang sama (`CHAT_MEMORY`), obrolan lain tidak ikut dikirim.

## Pengujian

Butuh Node 18+ dan `backend/.env.test` (lihat `backend/.env.example`).

```bash
node backend/test/run.mjs          # uji semua aksi API terhadap Supabase & Gemini sungguhan
node backend/test/run.mjs --no-ai  # tanpa memakai kuota Gemini
node backend/test/server.mjs       # jalankan Code.gs sebagai server lokal di :8787 (untuk uji frontend)
```

Uji memakai akun sementara `tes_...` yang otomatis dihapus di akhir.

## Daftar aksi API

| Aksi | Siapa | Keterangan |
|---|---|---|
| `auth.login`, `auth.register`, `auth.me`, `auth.logout` | semua | token sesi 30 hari |
| `profile.update` | login | nama, username, password |
| `data.pull` | siswa | artikel, skor kuis terbaik, bab materi, riwayat chat |
| `article.save`, `quiz.save`, `materi.read` | siswa | simpan progres |
| `ai.outline`, `ai.draft`, `chat.send`, `chat.delete` | siswa | Gemini |
| `guru.students`, `guru.student` | guru | progres seluruh siswa |
