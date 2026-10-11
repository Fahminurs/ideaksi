// Unduh artikel sebagai file PDF langsung (tanpa dialog cetak), format dokumen seperti Word:
// A4, Times 12pt, spasi 1,5, judul tebal di tengah, paragraf menjorok & rata kanan-kiri.
type Doc = { title: string; author: string; date: string; body: string };

const MM_PER_PT = 0.3528;

export async function downloadArticlePdf({ title, author, date, body }: Doc) {
  const { jsPDF } = await import("jspdf"); // dimuat hanya saat dibutuhkan
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const page = { w: 210, h: 297, left: 20, right: 20, top: 25, bottom: 25 };
  const width = page.w - page.left - page.right;
  const indent = 12.5;
  let y = page.top;

  const lineHeight = (pt: number, spacing = 1.5) => pt * MM_PER_PT * spacing;
  const ensure = (h: number) => {
    if (y + h > page.h - page.bottom) {
      doc.addPage();
      y = page.top;
    }
  };

  // judul
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  for (const line of doc.splitTextToSize(title, width) as string[]) {
    ensure(lineHeight(14, 1.3));
    doc.text(line, page.w / 2, y, { align: "center" });
    y += lineHeight(14, 1.3);
  }

  // penulis
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  y += 1;
  doc.text(`Oleh ${author} · Kelas VIII · ${date}`, page.w / 2, y, { align: "center" });
  y += 12;

  // isi
  doc.setFontSize(12);
  const lh = lineHeight(12);
  const paragraphs = body.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const para of paragraphs) {
    // baris pertama menjorok: potong dengan lebar lebih sempit dulu
    const first = (doc.splitTextToSize(para, width - indent) as string[])[0];
    const rest = para.slice(para.indexOf(first) + first.length).trim();
    const lines: { text: string; x: number; w: number }[] = [{ text: first, x: page.left + indent, w: width - indent }];
    if (rest) for (const l of doc.splitTextToSize(rest, width) as string[]) lines.push({ text: l, x: page.left, w: width });

    lines.forEach((l, i) => {
      ensure(lh);
      const last = i === lines.length - 1;
      // jsPDF tidak meratakan baris terakhir dari teks yang diberikan, jadi baris biasa dikirim
      // bersama baris kosong supaya baris itu sendiri ikut rata kanan-kiri
      if (last) doc.text(l.text, l.x, y);
      else doc.text([l.text, ""], l.x, y, { align: "justify", maxWidth: l.w });
      y += lh;
    });
    y += 2.5; // jarak antarparagraf
  }

  // nama file dari judul, dipotong di batas kata
  const clean = title.replace(/[^\p{L}\p{N} -]/gu, "").replace(/\s+/g, " ").trim();
  const safe = (clean.length > 80 ? clean.slice(0, 80).replace(/\s\S*$/, "") : clean) || "artikel";
  doc.save(`${safe}.pdf`);
}
