// Contoh artikel ilmiah populer beranotasi (untuk latihan). Fakta merujuk sumber yang disebut di dalam kalimat.

export type Part = "judul" | "pembuka" | "isi" | "penutup";
export type ExampleSection = { part: Part; paragraphs: string[]; note: string };
export type Example = {
  slug: string;
  title: string;
  category: "lingkungan" | "kesehatan" | "teknologi";
  sections: ExampleSection[];
};

export const PARTS: Record<Part, { label: string; stage: number }> = {
  judul: { label: "Judul", stage: 2 },
  pembuka: { label: "Pendahuluan", stage: 3 },
  isi: { label: "Isi", stage: 4 },
  penutup: { label: "Penutup", stage: 1 },
};

export const EXAMPLES: Example[] = [
  {
    slug: "bumi-semakin-panas",
    title: "Mengapa Bumi Semakin Panas? Fakta tentang Perubahan Iklim",
    category: "lingkungan",
    sections: [
      {
        part: "judul",
        paragraphs: ["Mengapa Bumi Semakin Panas? Fakta tentang Perubahan Iklim"],
        note: "Judul berbentuk pertanyaan membuat pembaca penasaran, lalu anak judul menjelaskan isi artikel.",
      },
      {
        part: "pembuka",
        paragraphs: [
          "Pernahkah kamu merasa siang hari terasa makin terik dibanding beberapa tahun lalu? Perasaan itu bukan sekadar perasaan. Menurut laporan Panel Antarpemerintah tentang Perubahan Iklim (IPCC) tahun 2023, suhu rata-rata permukaan Bumi sudah naik sekitar 1,1°C dibanding masa sebelum revolusi industri. Angka itu terlihat kecil, tetapi dampaknya besar. Lalu, apa penyebabnya dan apa yang bisa kita lakukan?",
        ],
        note: "Pendahuluan dibuka dengan pertanyaan yang dekat dengan pembaca, lalu langsung memberi data dan pertanyaan utama.",
      },
      {
        part: "isi",
        paragraphs: [
          "Penyebab utamanya adalah gas rumah kaca, seperti karbon dioksida dan metana. Gas-gas ini bekerja seperti selimut yang menahan panas matahari di atmosfer. Sebenarnya efek rumah kaca dibutuhkan agar Bumi tetap hangat. Masalahnya, jumlah gas tersebut terus bertambah sehingga panas yang tertahan juga makin banyak.",
          "Menurut IPCC, peningkatan gas rumah kaca terutama berasal dari aktivitas manusia. Pembakaran bahan bakar fosil untuk listrik, pabrik, dan kendaraan melepaskan karbon dioksida dalam jumlah besar. Penebangan hutan juga memperparah keadaan karena pohon yang seharusnya menyerap karbon dioksida ikut berkurang.",
          "Dampaknya sudah terasa di berbagai tempat. Es di kutub dan gletser mencair sehingga permukaan laut naik. Cuaca juga makin sulit ditebak: musim kemarau bisa lebih panjang, sedangkan hujan deras dapat datang tiba-tiba dan menyebabkan banjir. Di Indonesia, Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) juga mencatat tren kenaikan suhu udara dari tahun ke tahun.",
        ],
        note: "Isi menjelaskan sebab lalu akibat secara berurutan. Sumber (IPCC, BMKG) disebut langsung di dalam kalimat, dan kata “sehingga” serta “karena” membuat hubungan sebab-akibat jelas.",
      },
      {
        part: "penutup",
        paragraphs: [
          "Perubahan iklim bukan lagi ramalan masa depan, melainkan kenyataan yang sedang terjadi. Kabar baiknya, setiap orang bisa ikut mengurangi dampaknya. Kita dapat mematikan lampu dan perangkat listrik yang tidak dipakai, berjalan kaki atau bersepeda untuk jarak dekat, dan menanam pohon di sekitar rumah. Langkah kecil yang dilakukan banyak orang akan menghasilkan perubahan yang besar.",
        ],
        note: "Penutup merangkum pembahasan, lalu mengajak pembaca bertindak dengan contoh yang mudah dilakukan.",
      },
    ],
  },
  {
    slug: "mikroplastik-di-makanan",
    title: "Bahaya Mikroplastik di Makanan Kita",
    category: "kesehatan",
    sections: [
      {
        part: "judul",
        paragraphs: ["Bahaya Mikroplastik di Makanan Kita"],
        note: "Judul langsung menyebut topik dan memancing rasa ingin tahu karena berkaitan dengan makanan sehari-hari.",
      },
      {
        part: "pembuka",
        paragraphs: [
          "Plastik sudah menjadi bagian dari kehidupan sehari-hari, mulai dari botol minum sampai bungkus makanan. Namun, tahukah kamu bahwa plastik bisa pecah menjadi butiran yang sangat kecil hingga sulit terlihat mata? Butiran inilah yang disebut mikroplastik. Bagaimana mikroplastik bisa masuk ke makanan kita, dan apakah berbahaya?",
        ],
        note: "Pendahuluan mengenalkan istilah baru (mikroplastik) dengan bahasa sederhana sebelum menyampaikan pertanyaan utama.",
      },
      {
        part: "isi",
        paragraphs: [
          "Mikroplastik adalah potongan plastik yang ukurannya lebih kecil dari 5 milimeter, kira-kira sebesar biji wijen atau lebih kecil lagi. Mikroplastik dapat berasal dari sampah plastik besar yang terurai karena panas matahari dan gesekan, serta dari serat pakaian sintetis yang lepas saat dicuci.",
          "Karena ukurannya sangat kecil, mikroplastik mudah terbawa air ke sungai lalu ke laut. Hewan laut seperti ikan dan kerang dapat menelannya karena mengira itu makanan. Para peneliti telah menemukan mikroplastik pada garam laut, makanan laut, dan air minum. Organisasi Kesehatan Dunia (WHO) dalam laporannya tahun 2019 menyatakan bahwa keberadaan mikroplastik dalam air minum perlu terus diteliti.",
          "Lalu, apakah mikroplastik berbahaya bagi manusia? Sampai saat ini, para ilmuwan masih terus meneliti dampaknya. Menurut WHO, bukti yang ada belum cukup untuk menyimpulkan seberapa besar bahayanya bagi kesehatan. Meskipun demikian, para ahli sepakat bahwa sampah plastik perlu dikurangi agar mikroplastik tidak semakin banyak di lingkungan.",
        ],
        note: "Isi menyajikan fakta dengan jujur, termasuk hal yang belum pasti. Artikel ilmiah populer yang baik tidak melebih-lebihkan bahaya tanpa bukti.",
      },
      {
        part: "penutup",
        paragraphs: [
          "Mikroplastik memang kecil, tetapi berasal dari kebiasaan besar kita memakai plastik. Mengurangi plastik sekali pakai adalah langkah paling sederhana untuk mencegahnya. Mulailah dengan membawa botol minum dan tempat makan sendiri ke sekolah. Jika banyak orang melakukannya, jumlah plastik yang berakhir di laut, dan akhirnya di piring kita, bisa berkurang.",
        ],
        note: "Penutup menghubungkan kembali ke kehidupan pembaca dan memberi saran yang bisa langsung dilakukan.",
      },
    ],
  },
  {
    slug: "ai-menggantikan-guru",
    title: "Apakah AI Bisa Menggantikan Guru?",
    category: "teknologi",
    sections: [
      {
        part: "judul",
        paragraphs: ["Apakah AI Bisa Menggantikan Guru?"],
        note: "Judul berupa pertanyaan yang memancing rasa ingin tahu, lalu dijawab dengan tegas di penutup.",
      },
      {
        part: "pembuka",
        paragraphs: [
          "Sekarang banyak aplikasi yang bisa menjawab pertanyaan, membuat ringkasan, bahkan membantu mengerjakan latihan soal. Aplikasi seperti ini memakai kecerdasan buatan atau artificial intelligence (AI). Melihat kemampuannya, sebagian orang bertanya-tanya: apakah suatu hari nanti AI bisa menggantikan guru di kelas?",
        ],
        note: "Pendahuluan berangkat dari pengalaman sehari-hari siswa, menjelaskan singkatan AI, lalu mengajukan pertanyaan utama.",
      },
      {
        part: "isi",
        paragraphs: [
          "AI adalah program komputer yang dilatih menggunakan data dalam jumlah sangat besar sehingga dapat mengenali pola dan menghasilkan jawaban. Dalam belajar, AI dapat membantu menjelaskan materi dengan cepat, memberi contoh soal, dan menyesuaikan latihan dengan kemampuan siswa. Kemampuan ini membuat belajar menjadi lebih fleksibel.",
          "Namun, AI juga punya keterbatasan. AI bisa memberikan jawaban yang terdengar meyakinkan padahal keliru. Karena itu, jawaban AI tetap perlu diperiksa kembali dengan sumber lain. Selain itu, AI tidak benar-benar memahami perasaan siswa, misalnya ketika siswa sedang bingung, sedih, atau kehilangan semangat.",
          "Di sinilah peran guru sulit digantikan. Guru tidak hanya menyampaikan materi, tetapi juga membimbing, memberi teladan, dan membangun karakter siswa. UNESCO dalam panduan penggunaan AI generatif di bidang pendidikan tahun 2023 menekankan bahwa teknologi seharusnya mendukung guru, bukan menggantikan peran manusia dalam pendidikan.",
        ],
        note: "Isi membahas dua sisi (kelebihan dan keterbatasan) sebelum menarik kesimpulan. Kata “Namun” menandai pertentangan, dan sumber (UNESCO) disebut di dalam kalimat.",
      },
      {
        part: "penutup",
        paragraphs: [
          "Jadi, AI tidak dapat menggantikan guru, tetapi dapat menjadi alat bantu belajar yang bermanfaat. Kuncinya adalah menggunakan AI dengan bijak: jadikan AI teman untuk bertanya dan berlatih, lalu periksa jawabannya dan diskusikan dengan guru. Dengan begitu, teknologi membuat kita lebih pintar, bukan lebih malas berpikir.",
        ],
        note: "Penutup menjawab pertanyaan utama dengan tegas, lalu memberi pesan agar pembaca bijak memakai AI.",
      },
    ],
  },
];

export const wordCount = (e: Example) =>
  e.sections.flatMap((s) => s.paragraphs).join(" ").split(/\s+/).filter(Boolean).length;

// sekitar 200 kata per menit untuk pembaca SMP
export const readMinutes = (e: Example) => Math.max(1, Math.round(wordCount(e) / 200));
