"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronDown, CircleCheck, FileText, Heart, LogOut, PenLine, Sparkles, Trophy, UserPen } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { useArticles } from "@/lib/articles";
import { useQuizBest } from "@/lib/quiz";
import { updateProfile, type User } from "@/lib/session";
import LogoutDialog from "@/components/LogoutDialog";
import PasswordInput from "../../(auth)/PasswordInput";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./profil.module.css";

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const LINKS = [
  { href: "/menulis", icon: PenLine, title: "Artikel saya", desc: "Riwayat semua artikelmu", tone: "blue" },
  { href: "/contoh", icon: FileText, title: "Contoh artikel", desc: "Artikel yang sudah jadi", tone: "green" },
  { href: "/materi", icon: BookOpen, title: "Materi", desc: "Struktur & teknik menulis", tone: "pink" },
  { href: "/tanya-dea", icon: Sparkles, title: "Tanya Dea", desc: "Asisten menulismu", tone: "amber" },
];

function EditProfile({ user, onDone }: { user: User; onDone: (msg: string) => void }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const err = await updateProfile(user, name, username, password);
    setSaving(false);
    if (err) return setError(err);
    onDone(password ? "Profil dan password tersimpan." : "Profil tersimpan.");
  };

  return (
    <form onSubmit={submit} className={styles.editCard}>
      <h2>Ubah profil</h2>
      <label className={styles.field}>
        <span>Nama lengkap</span>
        <input className={styles.input} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} autoComplete="name" />
      </label>
      <label className={styles.field}>
        <span>Username</span>
        <input className={styles.input} value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} autoComplete="username" autoCapitalize="none" />
      </label>
      <label className={styles.field}>
        <span>Password baru <small>kosongkan kalau tidak diganti</small></span>
        <PasswordInput className={styles.input} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} autoComplete="new-password" />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.editActions}>
        <button type="button" className={styles.cancelBtn} onClick={() => onDone("")}>Batal</button>
        <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}

export default function ProfilPage() {
  const user = useUser();
  const articles = useArticles() ?? [];
  const quiz = useQuizBest();
  const done = articles.filter((a) => a.doneAt).length;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);

  const stats = [
    { icon: PenLine, label: "Artikel aktif", value: articles.length - done, tone: "blue" },
    { icon: CircleCheck, label: "Selesai", value: done, tone: "green" },
    { icon: Trophy, label: "Skor kuis", value: quiz ?? "-", tone: "amber" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.side}>
      <section className={styles.hero}>
        <span className={styles.avatar} aria-hidden>{user ? initials(user.name) : ""}</span>
        <h1>{user?.name}</h1>
        <p>
          <span className={styles.chip}>Kelas VIII</span>
          {user && <span className={styles.username}>@{user.username}</span>}
        </p>
        {!editing && (
          <button type="button" className={styles.editBtn} onClick={() => { setEditing(true); setSaved(""); }}>
            <UserPen size={18} aria-hidden /> Ubah profil
          </button>
        )}
      </section>

      {saved && <p className={styles.saved} role="status">{saved}</p>}
      {editing && user && (
        <EditProfile user={user} onDone={(msg) => { setEditing(false); setSaved(msg); }} />
      )}

      <ul className={styles.stats}>
        {stats.map(({ icon: Icon, label, value, tone }) => (
          <li key={label} data-tone={tone}>
            <span className={styles.statIcon} aria-hidden><Icon size={20} /></span>
            <strong>{value}</strong>
            <small>{label}</small>
          </li>
        ))}
      </ul>
      </div>

      <div className={styles.side}>
      <ul className={styles.links}>
        {LINKS.map(({ href, icon: Icon, title, desc, tone }) => (
          <li key={href} data-tone={tone}>
            <Link href={href} className={styles.link}>
              <span className={styles.linkIcon} aria-hidden><Icon size={20} /></span>
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* menu terpisah: buka-tutup tanpa JS lewat <details> */}
      <details className={`${styles.links} ${styles.about}`} data-tone="teal">
        <summary className={styles.link}>
          <span className={styles.linkIcon} aria-hidden><Heart size={20} /></span>
          <span>
            <strong>Tentang Ideaksi</strong>
            <small>Pembuat dan tujuan aplikasi</small>
          </span>
          <ChevronDown size={20} className={styles.chevron} aria-hidden />
        </summary>
        <div className={styles.aboutBody}>
          <p>Ideaksi membantu siswa kelas VIII menulis artikel ilmiah populer, dari ide sampai jadi.</p>
          <p>Dibuat oleh <strong>Nur Isna Sabrina</strong> untuk memenuhi Tugas Akhir PPG.</p>
        </div>
      </details>

      <div className={styles.actions}>
        <ThemeToggle withLabel className={styles.themeBtn} />
        <button type="button" className={styles.logout} onClick={() => setLogoutOpen(true)}>
          <LogOut size={20} aria-hidden /> Keluar
        </button>
      </div>
      </div>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} name={user?.name ?? ""} />
    </div>
  );
}
