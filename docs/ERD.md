# ERD Ideaksi

Database: Supabase (Postgres). Skema lengkap ada di [`supabase/schema.sql`](../supabase/schema.sql), data awal di [`supabase/seed.sql`](../supabase/seed.sql).

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : "masuk"
  USERS ||--o{ ARTICLES : "menulis"
  ARTICLES ||--o{ FACTS : "berisi"
  USERS ||--o{ QUIZ_ATTEMPTS : "mengerjakan"
  USERS ||--o{ MATERI_READS : "membaca"
  USERS ||--o{ CHAT_SESSIONS : "bertanya ke Dea"
  CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "berisi"
  USERS ||--o{ AI_USAGE : "memakai AI"

  USERS {
    uuid id PK
    text role "siswa | guru"
    text username UK
    text name
    text kelas
    text password_hash "sha256(salt + password)"
    text salt
    timestamptz created_at
    timestamptz updated_at
  }
  SESSIONS {
    text token PK
    uuid user_id FK
    timestamptz expires_at
  }
  ARTICLES {
    text id PK "uuid dari klien"
    uuid user_id FK
    smallint stage "1-6"
    text topic_category
    text topic_text
    text question_main
    jsonb question_subs
    jsonb outline "pendahuluan, isi, penutup"
    smallint outline_generated
    text draft_title
    text draft_body
    smallint draft_generated
    text revision_title
    text revision_body
    smallint revision_count
    jsonb revision_checks
    timestamptz done_at
    timestamptz updated_at
  }
  FACTS {
    bigint id PK
    text article_id FK
    smallint position
    text fact
    text source
  }
  QUIZ_ATTEMPTS {
    bigint id PK
    uuid user_id FK
    smallint score "0-100"
    timestamptz created_at
  }
  MATERI_READS {
    uuid user_id PK,FK
    text slug PK
    timestamptz read_at
  }
  CHAT_SESSIONS {
    text id PK "dari klien"
    uuid user_id FK
    text title
    timestamptz updated_at
  }
  CHAT_MESSAGES {
    bigint id PK
    text session_id FK
    text role "user | dea"
    text content
  }
  AI_USAGE {
    bigint id PK
    uuid user_id FK
    text kind "outline | draft | chat"
    int tokens
    timestamptz created_at
  }
```

## Catatan

- **Keamanan:** semua tabel memakai Row Level Security tanpa policy. Hanya backend (Google Apps Script dengan *service role key*) yang bisa membaca/menulis; kunci publik tidak bisa mengakses apa pun.
- **View `student_progress`:** ringkasan per siswa (artikel terakhir, tahap, skor kuis terbaik, jumlah bab materi) untuk dashboard guru.
- **Fungsi `save_article(user, json)`:** menyimpan artikel beserta faktanya dalam satu transaksi, dan menolak menimpa artikel milik siswa lain.
- **Memori Tanya Dea:** setiap pertanyaan hanya membawa 6 pesan terakhir dari obrolan yang sama, supaya hemat kuota.
- **Batas harian AI:** dihitung dari `ai_usage` (lihat `DAILY_LIMIT` di backend).
