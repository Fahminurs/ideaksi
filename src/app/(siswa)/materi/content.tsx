// Isi materi diambil utuh dari Materi/Materi_Artikel_Ilmiah_Populer_Kelas_VIII.docx.
// Satu bab = satu halaman (/materi/[slug]); daftar bab tampil sebagai galeri kartu di /materi.
import {
  BookOpen, Target, ListChecks, Rows3, Scale, Languages, Footprints, FileText, Search, type LucideIcon,
} from "lucide-react";
import styles from "./materi.module.css";

const Example = ({ label = "Contoh", children }: { label?: string; children: React.ReactNode }) => (
  <p className={styles.example}><span>{label}</span>{children}</p>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className={styles.note}>{children}</p>
);

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <th scope="row">{r[0]}</th>
              {r.slice(1).map((c, j) => <td key={j} data-label={head[j + 1]}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type Materi = {
  slug: string;
  title: string;
  icon: LucideIcon;
  stage: number; // warna kartu (warna tahap 1-6)
  minutes: number;
  content: React.ReactNode;
};

export const MATERI: Materi[] = [
  {
    slug: "pengertian",
    title: "Pengertian Artikel Ilmiah Populer",
    icon: BookOpen,
    stage: 1,
    minutes: 2,
    content: (
      <>
        <p>
          <strong>Artikel ilmiah populer</strong> adalah tulisan yang membahas pengetahuan, hasil
          pengamatan, penelitian, atau informasi ilmiah dengan menggunakan bahasa yang mudah
          dipahami oleh masyarakat umum. Artikel ini bertujuan menyampaikan informasi berdasarkan
          fakta dan pengetahuan yang dapat dipertanggungjawabkan tanpa menggunakan bahasa ilmiah
          yang terlalu rumit.
        </p>
        <Example label="Contoh topik">
          Manfaat membaca, dampak sampah plastik, pentingnya tidur cukup, dan
          pengaruh penggunaan gawai terhadap kegiatan belajar.
        </Example>
      </>
    ),
  },
  {
    slug: "tujuan",
    title: "Tujuan Artikel Ilmiah Populer",
    icon: Target,
    stage: 2,
    minutes: 2,
    content: (
      <>
        <ol className={styles.numbered}>
          <li>Memberikan informasi tentang suatu fenomena atau permasalahan.</li>
          <li>Menambah pengetahuan pembaca berdasarkan fakta dan sumber tepercaya.</li>
          <li>Menjelaskan ilmu pengetahuan dengan bahasa yang sederhana.</li>
          <li>Meningkatkan kesadaran pembaca terhadap suatu masalah.</li>
          <li>Mengajak pembaca berpikir kritis terhadap informasi yang diterima.</li>
        </ol>
      </>
    ),
  },
  {
    slug: "ciri",
    title: "Ciri-Ciri Artikel Ilmiah Populer",
    icon: ListChecks,
    stage: 3,
    minutes: 2,
    content: (
      <>
        <ul className={styles.bullets}>
          <li><strong>Berdasarkan fakta.</strong> Informasi didukung data, hasil pengamatan, penelitian, atau sumber tepercaya.</li>
          <li><strong>Menggunakan bahasa populer.</strong> Bahasa disampaikan secara sederhana, jelas, komunikatif, dan mudah dipahami.</li>
          <li><strong>Bersifat informatif.</strong> Tulisan memberikan pengetahuan baru atau menjelaskan suatu peristiwa kepada pembaca.</li>
          <li><strong>Membahas topik dekat dengan kehidupan.</strong> Topik dapat berupa pendidikan, kesehatan, lingkungan, teknologi, atau fenomena sosial.</li>
          <li><strong>Didukung sumber tepercaya.</strong> Informasi perlu diperiksa kebenarannya dan tidak sekadar berdasarkan dugaan.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "struktur",
    title: "Struktur Artikel Ilmiah Populer",
    icon: Rows3,
    stage: 4,
    minutes: 3,
    content: (
      <>
        <div className={styles.part} data-part="pembuka">
          <h3>Pembuka (pendahuluan)</h3>
          <p>Berisi pengenalan topik, latar belakang masalah, fenomena, atau pertanyaan yang menarik perhatian pembaca.</p>
          <Example><em>Mengapa banyak siswa merasa sulit berkonsentrasi ketika belajar?</em></Example>
        </div>
        <div className={styles.part} data-part="isi">
          <h3>Isi (pembahasan)</h3>
          <p>Berisi penjelasan utama yang didukung fakta, data, alasan, contoh, atau hasil penelitian yang relevan.</p>
          <Example><em>Konsentrasi dapat terganggu ketika seseorang kurang tidur atau sering menerima notifikasi gawai.</em></Example>
        </div>
        <div className={styles.part} data-part="penutup">
          <h3>Penutup (simpulan)</h3>
          <p>Berisi rangkuman pembahasan, penegasan gagasan utama, atau saran yang sesuai dengan topik.</p>
          <Example><em>Oleh karena itu, siswa perlu mengatur waktu istirahat dan mengurangi gangguan saat belajar.</em></Example>
        </div>
        <Note>
          <strong>Catatan:</strong> Struktur artikel dapat bervariasi sesuai dengan tujuan dan media
          penerbitannya. Judul biasanya ditulis sebelum bagian pembuka.
        </Note>
      </>
    ),
  },
  {
    slug: "fakta-opini",
    title: "Fakta dan Opini",
    icon: Scale,
    stage: 5,
    minutes: 3,
    content: (
      <>
        <p>
          <strong>Fakta.</strong> Pernyataan yang dapat diperiksa atau dibuktikan kebenarannya
          melalui data, pengamatan, atau sumber tepercaya.
        </p>
        <Example>Air membeku pada suhu 0°C dalam kondisi tekanan 1 atmosfer.</Example>
        <p>
          <strong>Opini.</strong> Pernyataan yang berisi pendapat, penilaian, dugaan, atau
          pandangan seseorang.
        </p>
        <Example>Menurut saya, membaca buku merupakan kegiatan paling menyenangkan.</Example>
        <Table
          head={["Aspek", "Fakta", "Opini"]}
          rows={[
            ["Kebenaran", "Dapat diperiksa", "Berisi pandangan atau penilaian"],
            ["Dukungan", "Data atau bukti", "Alasan atau sudut pandang"],
            ["Kata penanda", "Berdasarkan data, tercatat, hasil pengamatan", "Menurut saya, sebaiknya, tampaknya"],
            ["Contoh", "Sekolah memiliki perpustakaan.", "Perpustakaan sekolah itu sangat menarik."],
          ]}
        />
        <Note>
          <strong>Perlu diingat:</strong> kata penanda tidak selalu menentukan jenis pernyataan.
          Kalimat yang menggunakan kata “menurut penelitian” tetap perlu diperiksa sumber dan bukti
          pendukungnya.
        </Note>
      </>
    ),
  },
  {
    slug: "kebahasaan",
    title: "Kaidah Kebahasaan",
    icon: Languages,
    stage: 6,
    minutes: 3,
    content: (
      <>
        <Table
          head={["Kaidah kebahasaan", "Fungsi", "Contoh"]}
          rows={[
            ["Kata baku", "Menjaga ketepatan bahasa", "aktivitas, risiko, kualitas"],
            ["Istilah ilmiah", "Menjelaskan konsep tertentu", "ekosistem, konsentrasi, polusi"],
            ["Konjungsi sebab-akibat", "Menjelaskan hubungan sebab dan akibat", "karena, sehingga, akibatnya"],
            ["Konjungsi pertentangan", "Membandingkan dua gagasan", "tetapi, namun, sedangkan"],
            ["Kalimat fakta", "Menyampaikan informasi yang dapat diperiksa", "Hasil pengamatan menunjukkan adanya sampah di selokan."],
            ["Kalimat opini", "Menyampaikan pendapat atau saran", "Menurut penulis, kebiasaan memilah sampah perlu ditingkatkan."],
            ["Kata rujukan", "Menghubungkan informasi dengan sumber atau bagian sebelumnya", "tersebut, ini, hal itu"],
          ]}
        />
        <p>
          Bahasa dalam artikel ilmiah populer sebaiknya jelas, logis, efektif, dan sesuai kaidah
          bahasa Indonesia.
        </p>
      </>
    ),
  },
  {
    slug: "langkah",
    title: "Langkah-Langkah Menulis",
    icon: Footprints,
    stage: 1,
    minutes: 2,
    content: (
      <>
        <ol className={styles.steps}>
          <li><strong>Menentukan topik.</strong> Pilih masalah yang menarik dan dekat dengan kehidupan sehari-hari.</li>
          <li><strong>Merumuskan tujuan dan judul.</strong> Tentukan informasi yang ingin disampaikan dan buat judul yang jelas serta menarik.</li>
          <li><strong>Mengumpulkan informasi.</strong> Cari fakta, data, hasil pengamatan, atau referensi dari sumber tepercaya.</li>
          <li><strong>Menyusun kerangka.</strong> Atur gagasan menjadi pembuka, isi, dan penutup.</li>
          <li><strong>Mengembangkan tulisan.</strong> Susun paragraf yang saling berhubungan dengan bahasa yang mudah dipahami.</li>
          <li><strong>Memeriksa dan menyunting.</strong> Periksa ketepatan fakta, sumber, ejaan, tanda baca, dan kejelasan kalimat.</li>
        </ol>
      </>
    ),
  },
  {
    slug: "contoh",
    title: "Contoh Artikel Ilmiah Populer",
    icon: FileText,
    stage: 2,
    minutes: 3,
    content: (
      <>
        <div className={styles.sample}>
          <h3 className={styles.sampleTitle}>Mengurangi Sampah Plastik, Menjaga Lingkungan</h3>
          <div className={styles.part} data-part="pembuka">
            <h4>Pembuka</h4>
            <p>
              Sampah plastik menjadi salah satu permasalahan lingkungan yang sering dijumpai dalam
              kehidupan sehari-hari. Kantong plastik, botol minuman, dan bungkus makanan banyak
              digunakan karena praktis. Namun, penggunaan plastik sekali pakai yang tidak diikuti
              pengelolaan sampah yang baik dapat menimbulkan masalah bagi lingkungan.
            </p>
          </div>
          <div className={styles.part} data-part="isi">
            <h4>Isi</h4>
            <p>
              Plastik tertentu membutuhkan waktu sangat lama untuk terurai secara alami. Jika
              dibuang sembarangan, sampah plastik dapat menyumbat saluran air dan mencemari sungai.
              Sampah yang terpecah menjadi bagian lebih kecil juga dapat menyebar ke lingkungan dan
              mengganggu kehidupan makhluk hidup.
            </p>
            <p>
              Salah satu upaya yang dapat dilakukan adalah mengurangi penggunaan plastik sekali
              pakai. Siswa dapat membawa botol minum dan tempat makan sendiri dari rumah. Selain
              itu, sampah perlu dipilah sesuai jenisnya agar dapat dikelola dengan lebih tepat.
            </p>
            <p>
              Kebiasaan tersebut akan lebih efektif apabila dilakukan bersama-sama. Sekolah dapat
              menyediakan tempat sampah terpilah dan mengadakan kegiatan edukasi mengenai
              pengelolaan sampah. Informasi tentang dampak sampah juga perlu disampaikan berdasarkan
              sumber yang tepercaya agar masyarakat memahami pentingnya perubahan kebiasaan.
            </p>
          </div>
          <div className={styles.part} data-part="penutup">
            <h4>Penutup</h4>
            <p>
              Mengurangi sampah plastik dapat dimulai dari tindakan sederhana dalam kehidupan
              sehari-hari. Membawa botol minum sendiri, menggunakan barang secara berulang, dan
              membuang sampah pada tempatnya merupakan langkah yang dapat dilakukan siswa. Jika
              kebiasaan ini diterapkan secara konsisten, upaya menjaga lingkungan dapat menjadi
              bagian dari kehidupan sehari-hari.
            </p>
          </div>
        </div>
        <Note>
          <strong>Catatan:</strong> Contoh tersebut merupakan model tulisan untuk latihan. Jika
          digunakan sebagai artikel ilmiah populer yang akan diterbitkan, tambahkan data pendukung
          dan cantumkan sumber referensi yang benar-benar diperiksa.
        </Note>
      </>
    ),
  },
  {
    slug: "analisis",
    title: "Menganalisis Isi Artikel",
    icon: Search,
    stage: 3,
    minutes: 2,
    content: (
      <>
        <Table
          head={["Unsur yang dianalisis", "Pertanyaan panduan"]}
          rows={[
            ["Topik", "Apa masalah utama yang dibahas?"],
            ["Tujuan", "Mengapa penulis membuat artikel tersebut?"],
            ["Gagasan utama", "Apa inti pembahasan setiap paragraf?"],
            ["Fakta", "Informasi apa yang dapat dibuktikan?"],
            ["Opini", "Pendapat atau saran apa yang disampaikan penulis?"],
            ["Bukti pendukung", "Data, contoh, atau sumber apa yang digunakan?"],
            ["Simpulan", "Apa pesan utama dari artikel tersebut?"],
          ]}
        />
      </>
    ),
  },
];
