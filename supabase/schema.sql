-- Ideaksi: skema database (Supabase / Postgres).
-- Semua akses lewat backend Vercel (src/server/api.ts) memakai service role key.
-- RLS dinyalakan tanpa policy => kunci anon/publik tidak bisa membaca apa pun.
-- Aman dijalankan ulang (idempotent) kecuali bagian seed yang memakai ON CONFLICT.

create extension if not exists pgcrypto with schema extensions;

-- ========== Pengguna & sesi ==========
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  role          text not null check (role in ('siswa', 'guru')),
  username      text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  name          text not null check (char_length(name) between 3 and 80),
  kelas         text not null default 'VIII',
  password_hash text not null,          -- sha256(salt || password), hex
  salt          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.sessions (
  token      text primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on public.sessions (user_id);

-- ========== Artikel (6 tahap menulis) ==========
create table if not exists public.articles (
  id                text primary key,   -- dibuat di klien (uuid) supaya bisa simpan offline dulu
  user_id           uuid not null references public.users (id) on delete cascade,
  stage             smallint not null default 1 check (stage between 1 and 6),
  topic_category    text,
  topic_text        text,
  question_main     text,
  question_subs     jsonb not null default '[]'::jsonb,
  outline           jsonb,              -- {pendahuluan, isi, penutup}
  outline_generated smallint not null default 0,
  draft_title       text,
  draft_body        text,
  draft_generated   smallint not null default 0,
  revision_title    text,
  revision_body     text,
  revision_count    smallint not null default 0,
  revision_checks   jsonb not null default '[]'::jsonb,
  done_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists articles_user_idx on public.articles (user_id, updated_at desc);

create table if not exists public.facts (
  id         bigint generated always as identity primary key,
  article_id text not null references public.articles (id) on delete cascade,
  position   smallint not null,
  fact       text not null,
  source     text not null
);
create index if not exists facts_article_idx on public.facts (article_id, position);

-- ========== Belajar: kuis & materi ==========
create table if not exists public.quiz_attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  score      smallint not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists quiz_user_idx on public.quiz_attempts (user_id, score desc);

create table if not exists public.materi_reads (
  user_id uuid not null references public.users (id) on delete cascade,
  slug    text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, slug)
);

-- ========== Tanya Dea ==========
create table if not exists public.chat_sessions (
  id         text primary key,          -- dibuat di klien
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text not null default 'Obrolan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_sessions_user_idx on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  session_id text not null references public.chat_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'dea')),
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, id);

-- Pemakaian AI per siswa per hari (batas harian supaya kuota gratis Gemini awet)
create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  kind       text not null check (kind in ('outline', 'draft', 'chat')),
  tokens     integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);

-- ========== Ringkasan progres untuk dashboard guru ==========
create or replace view public.student_progress
with (security_invoker = true) as
select
  u.id,
  u.username,
  u.name,
  u.kelas,
  greatest(u.updated_at, coalesce(a.updated_at, u.updated_at)) as last_active,
  (select max(q.score) from public.quiz_attempts q where q.user_id = u.id) as quiz_best,
  (select count(*) from public.materi_reads m where m.user_id = u.id)::int as materi_read,
  a.id as article_id,
  a.stage,
  a.done_at,
  a.topic_text,
  a.question_main,
  coalesce(a.revision_title, a.draft_title) as title,
  (select count(*) from public.facts f where f.article_id = a.id)::int as facts,
  a.outline_generated,
  a.draft_generated,
  a.revision_count,
  coalesce(a.revision_body, a.draft_body) as body
from public.users u
left join lateral (
  select * from public.articles x where x.user_id = u.id order by x.updated_at desc limit 1
) a on true
where u.role = 'siswa';

-- ========== Keamanan: RLS tanpa policy (hanya service role) ==========
alter table public.users          enable row level security;
alter table public.sessions       enable row level security;
alter table public.articles       enable row level security;
alter table public.facts          enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.materi_reads   enable row level security;
alter table public.chat_sessions  enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.ai_usage       enable row level security;

-- updated_at otomatis
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists users_touch on public.users;
create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();
drop trigger if exists articles_touch on public.articles;
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();
drop trigger if exists chat_sessions_touch on public.chat_sessions;
create trigger chat_sessions_touch before update on public.chat_sessions
  for each row execute function public.touch_updated_at();

-- Simpan artikel + fakta dalam satu transaksi (dipanggil backend lewat RPC)
create or replace function public.save_article(p_user uuid, p jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  insert into public.articles as a (
    id, user_id, stage, topic_category, topic_text, question_main, question_subs, outline,
    outline_generated, draft_title, draft_body, draft_generated, revision_title, revision_body,
    revision_count, revision_checks, done_at
  ) values (
    p->>'id', p_user, coalesce((p->>'stage')::smallint, 1), p->>'topic_category', p->>'topic_text',
    p->>'question_main', coalesce(p->'question_subs', '[]'::jsonb), p->'outline',
    coalesce((p->>'outline_generated')::smallint, 0), p->>'draft_title', p->>'draft_body',
    coalesce((p->>'draft_generated')::smallint, 0), p->>'revision_title', p->>'revision_body',
    coalesce((p->>'revision_count')::smallint, 0), coalesce(p->'revision_checks', '[]'::jsonb),
    (p->>'done_at')::timestamptz
  )
  on conflict (id) do update set
    stage = excluded.stage, topic_category = excluded.topic_category, topic_text = excluded.topic_text,
    question_main = excluded.question_main, question_subs = excluded.question_subs, outline = excluded.outline,
    outline_generated = greatest(a.outline_generated, excluded.outline_generated),
    draft_title = excluded.draft_title, draft_body = excluded.draft_body,
    draft_generated = greatest(a.draft_generated, excluded.draft_generated),
    revision_title = excluded.revision_title, revision_body = excluded.revision_body,
    revision_count = excluded.revision_count, revision_checks = excluded.revision_checks,
    done_at = excluded.done_at
  where a.user_id = p_user;               -- tidak bisa menimpa artikel milik orang lain

  if not found then
    raise exception 'article belongs to another user';
  end if;

  delete from public.facts where article_id = p->>'id';
  insert into public.facts (article_id, position, fact, source)
  select p->>'id', (f.ord - 1)::smallint, f.val->>'fact', f.val->>'source'
  from jsonb_array_elements(coalesce(p->'facts', '[]'::jsonb)) with ordinality as f(val, ord)
  where coalesce(f.val->>'fact', '') <> '';
end $$;

revoke all on function public.save_article(uuid, jsonb) from public, anon, authenticated;
revoke all on public.student_progress from anon, authenticated;
