import { Leaf, HeartPulse, Cpu, Users, FlaskConical } from "lucide-react";

// Kategori & saran topik untuk Tahap 1.
export const CATEGORIES = [
  {
    id: "lingkungan", label: "Lingkungan", icon: Leaf,
    topics: [
      "Bahaya Sampah Plastik bagi Sungai di Sekitar Kita",
      "Mengapa Kita Harus Hemat Air?",
      "Manfaat Menanam Pohon di Sekolah",
      "Dampak Polusi Udara bagi Kesehatan",
      "Mengapa Banjir Sering Terjadi di Kota?",
    ],
  },
  {
    id: "kesehatan", label: "Kesehatan", icon: HeartPulse,
    topics: [
      "Dampak Gadget terhadap Kesehatan Remaja",
      "Bahaya Makanan Cepat Saji bagi Tubuh",
      "Pentingnya Olahraga untuk Pelajar",
      "Mengapa Tidur Cukup Itu Penting?",
      "Bahaya Minuman Berpemanis Buatan",
    ],
  },
  {
    id: "teknologi", label: "Teknologi", icon: Cpu,
    topics: [
      "Apakah AI Bisa Menggantikan Guru?",
      "Manfaat dan Bahaya Media Sosial bagi Remaja",
      "Bagaimana Internet Bekerja?",
      "Bagaimana Aplikasi Belajar Membantu Siswa?",
      "Bahaya Hoaks di Grup Percakapan",
    ],
  },
  {
    id: "sosial", label: "Sosial", icon: Users,
    topics: [
      "Mengapa Perundungan Masih Terjadi di Sekolah?",
      "Pentingnya Gotong Royong di Lingkungan Rumah",
      "Dampak Bermain Gim terhadap Pertemanan",
      "Mengapa Minat Baca Remaja Rendah?",
      "Manfaat Kegiatan Ekstrakurikuler",
    ],
  },
  {
    id: "sains", label: "Sains", icon: FlaskConical,
    topics: [
      "Kenapa Langit Berwarna Biru?",
      "Mengapa Bumi Semakin Panas?",
      "Bagaimana Pelangi Terbentuk?",
      "Mengapa Es Mengapung di Air?",
      "Bagaimana Gempa Bumi Terjadi?",
    ],
  },
];
