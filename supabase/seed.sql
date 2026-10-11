-- Data awal: akun demo (siswa123 / guru123) + 10 siswa contoh untuk dashboard guru.
-- Aman dijalankan ulang: akun yang sudah ada tidak diubah.

insert into public.users (role, username, name, password_hash, salt)
select v.role, v.username, v.name,
       encode(extensions.digest(s.salt || v.pw, 'sha256'), 'hex'), s.salt
from (values
  ('guru',  'guru',   'Ibu Sari',          'guru123'),
  ('siswa', 'aisyah', 'Aisyah Rahmawati',  'siswa123'),
  ('siswa', 'budi',   'Budi Santoso',      'siswa123'),
  ('siswa', 'citra',  'Citra Dewi',        'siswa123'),
  ('siswa', 'doni',   'Doni Pratama',      'siswa123'),
  ('siswa', 'eka',    'Eka Wulandari',     'siswa123'),
  ('siswa', 'fira',   'Fira Anjani',       'siswa123'),
  ('siswa', 'gilang', 'Gilang Ramadhan',   'siswa123'),
  ('siswa', 'hana',   'Hana Putri',        'siswa123'),
  ('siswa', 'irfan',  'Irfan Hakim',       'siswa123'),
  ('siswa', 'jihan',  'Jihan Salsabila',   'siswa123')
) as v(role, username, name, pw)
cross join lateral (select md5(random()::text || v.username) as salt) s
on conflict (username) do nothing;

-- Artikel contoh (hanya kalau siswa itu belum punya artikel)
insert into public.articles (id, user_id, stage, topic_category, topic_text, question_main,
  outline, outline_generated, draft_title, draft_body, draft_generated,
  revision_title, revision_body, revision_count, revision_checks, done_at)
select 'seed-' || u.username, u.id, v.stage, v.cat, v.topic, v.q,
       case when v.stage >= 5 then '{"pendahuluan":"Kenalkan topik dan pertanyaan.","isi":"Fakta dan penjelasan.","penutup":"Kesimpulan dan saran."}'::jsonb end,
       v.og, v.title, v.body, v.dg, v.rtitle, v.body, v.rc,
       case when v.done then '[true,true,true,true]'::jsonb else '[]'::jsonb end,
       case when v.done then now() - interval '1 day' end
from (values
  ('aisyah', 6, 'kesehatan', 'Dampak gadget terhadap kesehatan remaja',
   'Bagaimana penggunaan gadget berlebihan memengaruhi kesehatan remaja?',
   1, 'Dampak Gadget terhadap Kesehatan Remaja: Fakta yang Perlu Kamu Tahu', 1,
   'Dampak Gadget terhadap Kesehatan Remaja: Fakta yang Perlu Kamu Tahu', 2, true,
   E'Pernahkah kamu menghitung berapa jam kamu memegang gadget setiap hari? Bagi banyak remaja, gadget sudah menjadi teman sejak bangun tidur sampai menjelang tidur. Lalu, bagaimana penggunaan gadget yang berlebihan memengaruhi kesehatan remaja?\n\nMenurut Kementerian Kesehatan (2024), sebagian besar remaja Indonesia memakai gadget lebih dari lima jam per hari. Waktu selama itu sering diambil dari jam tidur dan jam bermain di luar rumah.\n\nWHO (2023) juga mencatat bahwa cahaya biru dari layar dapat mengganggu kualitas tidur. Akibatnya, remaja lebih mudah mengantuk dan sulit berkonsentrasi di sekolah.\n\nGadget memang membantu kita belajar dan berkomunikasi. Namun, penggunaannya perlu dibatasi. Mulailah dengan menyimpan gadget satu jam sebelum tidur dan menggantinya dengan membaca buku atau berolahraga.'),
  ('budi', 5, 'lingkungan', 'Sampah plastik di sungai',
   'Mengapa sampah plastik di sungai berbahaya bagi makhluk hidup?', 2, null, 0, null, 0, false, null),
  ('citra', 3, 'kesehatan', 'Manfaat sarapan bagi pelajar',
   'Apa manfaat sarapan bagi konsentrasi belajar pelajar?', 0, null, 0, null, 0, false, null),
  ('doni', 2, 'teknologi', 'Penggunaan AI di sekolah', null, 0, null, 0, null, 0, false, null),
  ('eka', 1, null, null, null, 0, null, 0, null, 0, false, null),
  ('gilang', 6, 'lingkungan', 'Hemat air di rumah',
   'Mengapa menghemat air penting bagi masa depan?', 1, 'Mengapa Kita Harus Hemat Air?', 2,
   'Mengapa Kita Harus Hemat Air?', 3, true,
   E'Air bersih terasa mudah didapat, tetapi persediaannya terbatas. Mengapa menghemat air penting bagi masa depan?\n\nMenurut BPS (2024), kebutuhan air bersih di kota besar terus meningkat setiap tahun.\n\nKebiasaan kecil seperti mematikan keran saat menggosok gigi dapat menghemat banyak liter air setiap hari.'),
  ('hana', 4, 'lingkungan', 'Manfaat menanam pohon di sekolah',
   'Bagaimana pohon di sekolah membantu kenyamanan belajar?', 1, null, 0, null, 0, false, null),
  ('irfan', 6, 'lingkungan', 'Polusi udara di kota',
   'Bagaimana polusi udara memengaruhi kesehatan paru-paru?', 1, 'Polusi Udara dan Kesehatan Paru-Paru', 1,
   'Polusi Udara dan Kesehatan Paru-Paru', 1, false, null),
  ('jihan', 3, 'kesehatan', 'Bahaya jajanan berpewarna',
   'Apa dampak pewarna buatan pada jajanan bagi kesehatan?', 0, null, 0, null, 0, false, null)
) as v(username, stage, cat, topic, q, og, title, dg, rtitle, rc, done, body)
join public.users u on u.username = v.username
where not exists (select 1 from public.articles a where a.user_id = u.id)
on conflict (id) do nothing;

-- Fakta contoh
insert into public.facts (article_id, position, fact, source)
select a.id, g - 1, 'Fakta contoh ke-' || g || ' tentang ' || coalesce(a.topic_text, 'topik ini') || '.', 'Contoh sumber, 2024'
from public.articles a
cross join generate_series(1, 3) g
where a.id like 'seed-%' and a.stage >= 4
  and not exists (select 1 from public.facts f where f.article_id = a.id);

-- Skor kuis & materi contoh
insert into public.quiz_attempts (user_id, score)
select u.id, v.score from (values
  ('aisyah', 90), ('budi', 80), ('citra', 70), ('doni', 60), ('gilang', 100),
  ('hana', 90), ('irfan', 70), ('jihan', 50)
) v(username, score)
join public.users u on u.username = v.username
where not exists (select 1 from public.quiz_attempts q where q.user_id = u.id);

insert into public.materi_reads (user_id, slug)
select u.id, m.slug
from (values ('aisyah', 9), ('budi', 7), ('citra', 5), ('doni', 3), ('eka', 2),
             ('gilang', 9), ('hana', 8), ('irfan', 6), ('jihan', 4)) v(username, n)
join public.users u on u.username = v.username
cross join lateral (
  select slug from unnest(array['pengertian','tujuan','ciri','struktur','fakta-opini','kebahasaan','langkah','contoh','analisis'])
    with ordinality t(slug, i) where i <= v.n
) m
on conflict do nothing;
