import DevLogin from "@/components/DevLogin";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Lexend } from "next/font/google";
import "./globals.css";

// Lexend (judul/menu) & Atkinson Hyperlegible Next (bacaan): dirancang agar mudah dibaca semua orang.
const heading = Lexend({ subsets: ["latin"], variable: "--font-heading" });
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Ideaksi - Dari Ide Menjadi Artikel Ilmiah Populer",
  description: "Platform pendamping menulis artikel ilmiah populer untuk siswa kelas VIII SMP",
};

// Pasang tema tersimpan sebelum halaman tampil, supaya tidak berkedip terang-gelap.
const themeScript = `try{var t=localStorage.getItem("ideaksi_theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${heading.variable} ${body.variable}`}>
        {children}
        <DevLogin />
      </body>
    </html>
  );
}
