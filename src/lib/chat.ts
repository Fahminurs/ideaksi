import { useMemo, useSyncExternalStore } from "react";

// Dea, asisten menulis Ideaksi. Prompt & panggilan Gemini ada di backend (backend/Code.gs, DEA_SYSTEM).

// Mode lokal (tanpa backend): jawaban berbasis kata kunci.
const RULES: [RegExp, string][] = [
  [/judul/i, "Judul yang baik itu singkat, jelas, dan bikin penasaran. Coba cek: apakah judulmu sudah menunjukkan apa yang dibahas dan kenapa itu penting? Tulis 2–3 pilihan judul, lalu pilih yang paling menarik menurutmu. 😊"],
  [/pendahuluan|pembuka/i, "Pendahuluan berisi latar belakang topik, alasan topik itu penting, dan pertanyaan utama. Kamu bisa membuka dengan fakta mengejutkan atau pertanyaan untuk pembaca. Coba tulis satu kalimat pembuka dulu, nanti aku bantu cek."],
  [/penutup|simpulan|kesimpulan/i, "Penutup berisi rangkuman, kesimpulan, dan ajakan untuk pembaca. Coba jawab: apa satu hal yang paling ingin kamu ingat-kan ke pembaca setelah membaca artikelmu?"],
  [/isi|pembahasan/i, "Bagian isi menjelaskan jawaban dari pertanyaan utamamu, didukung fakta dan sumbernya. Usahakan satu paragraf membahas satu gagasan, lalu sebutkan sumbernya di dalam kalimat, misalnya “Menurut WHO (2023), …”."],
  [/fakta|data/i, "Fakta adalah informasi yang bisa dibuktikan, misalnya angka, hasil penelitian, atau hasil pengamatan. Cari dari sumber tepercaya seperti situs pemerintah, lembaga resmi, atau buku. Jangan lupa catat sumber dan tahunnya, ya."],
  [/sumber|referensi|kutip/i, "Sumber bisa disebut langsung di dalam kalimat. Contoh: “Menurut data Kementerian Kesehatan tahun 2024, …”. Pilih sumber yang jelas siapa penulis atau lembaganya dan kapan diterbitkan."],
  [/pertanyaan/i, "Pertanyaan utama yang baik biasanya diawali “Bagaimana…”, “Mengapa…”, atau “Apa dampak…”, dan bisa dijawab dengan fakta. Coba tulis pertanyaanmu, lalu tanyakan ke dirimu: bisakah aku mencari datanya?"],
  [/topik|tema/i, "Topik yang bagus itu dekat dengan kehidupanmu dan bisa dicari faktanya. Coba pikirkan hal yang sering kamu lihat di sekolah atau rumah, lalu tanyakan “kenapa itu terjadi?”."],
  [/kerangka/i, "Kerangka itu peta tulisanmu: pendahuluan, isi, dan penutup. Tulis satu atau dua poin untuk tiap bagian dulu. Tidak perlu kalimat lengkap, yang penting urutannya jelas."],
];

const OFF_TOPIC = /\b(game|gim|lagu|film|pacar|matematika|pr ?mtk|jawaban soal)\b/i;

export function mockReply(text: string): string {
  if (OFF_TOPIC.test(text)) return "Maaf, aku hanya bisa membantu seputar penulisan artikel ilmiah populer ya! 😊";
  const hit = RULES.find(([re]) => re.test(text));
  return hit
    ? hit[1]
    : "Pertanyaan bagus! Ceritakan sedikit tentang bagian artikel yang sedang kamu kerjakan (judul, pendahuluan, isi, atau penutup), supaya aku bisa membantu lebih tepat.";
}

// Riwayat obrolan: cache localStorage (maks. 20 terakhir). Mode API: disimpan server saat chat.send, ditarik lewat data.pull.
export type ChatMsg = { from: "bot" | "me"; text: string };
export type ChatSession = { id: string; title: string; updated: string; messages: ChatMsg[] };
const CHATS_KEY = "ideaksi_chats";

export function loadChats(): ChatSession[] {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const CHATS_EVENT = "ideaksi-chats";

export function saveChat(session: ChatSession) {
  const rest = loadChats().filter((c) => c.id !== session.id);
  localStorage.setItem(CHATS_KEY, JSON.stringify([session, ...rest].slice(0, 20)));
  window.dispatchEvent(new Event(CHATS_EVENT));
}

function subscribeChats(cb: () => void) {
  window.addEventListener(CHATS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHATS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const readChatsRaw = () => localStorage.getItem(CHATS_KEY) ?? "[]";

// Daftar riwayat yang ikut berubah saat obrolan disimpan.
export function useChats(): ChatSession[] {
  const raw = useSyncExternalStore(subscribeChats, readChatsRaw, () => "[]");
  return useMemo(() => {
    try {
      return JSON.parse(raw) as ChatSession[];
    } catch {
      return [];
    }
  }, [raw]);
}
