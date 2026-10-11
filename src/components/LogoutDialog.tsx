"use client";

// Konfirmasi keluar: <dialog> bawaan browser (fokus terkunci, Esc menutup), tampil sebagai kartu bergaya Ideaksi.
// Setelah "Ya, keluar" kartu langsung berganti jadi salam perpisahan sambil sesi dibuang (tanpa spinner).
import { useEffect, useRef, useState } from "react";
import { Hand, LogOut } from "lucide-react";
import { logout } from "@/lib/session";
import styles from "./LogoutDialog.module.css";

export default function LogoutDialog({ open, onClose, name }: { open: boolean; onClose: () => void; name: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [bye, setBye] = useState(false);
  // nama dibekukan saat "Ya, keluar" ditekan, karena data pengguna langsung dibuang dan nama jadi kosong
  const [frozen, setFrozen] = useState<string | null>(null);
  const first = frozen ?? (name.trim().split(/\s+/)[0] || "kamu");

  // Layout tidak dibongkar saat keluar, jadi state dialog terbawa ke login berikutnya.
  // Nama kosong = pengguna sudah keluar; terisi lagi = sesi baru -> mulai dari awal.
  const [prevName, setPrevName] = useState(name);
  if (name !== prevName) {
    setPrevName(name);
    if (name) {
      setBye(false);
      setFrozen(null);
    }
  }

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open && !bye) d.close(); // salam perpisahan tetap tampil sampai pindah halaman
  }, [open, bye]);

  const leave = () => {
    setFrozen(first);
    setBye(true);
    onClose(); // parent ikut menutup, supaya login berikutnya tidak langsung membuka dialog
    logout();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onCancel={(e) => bye && e.preventDefault()}
      onClick={(e) => e.target === ref.current && !bye && onClose()} // klik di luar kartu = batal
      aria-labelledby="logout-title"
    >
      <div className={styles.card} data-bye={bye || undefined}>
        <div className={styles.art} aria-hidden>
          <span className={styles.orb}>{bye ? <Hand size={38} className={styles.wave} /> : <LogOut size={34} />}</span>
        </div>

        <div className={styles.body}>
          {bye ? (
            <>
              <h2 id="logout-title">Sampai jumpa, {first}!</h2>
              <p>Tulisanmu aman tersimpan. Ditunggu lagi, ya.</p>
            </>
          ) : (
            <>
              <h2 id="logout-title">Mau keluar dulu, {first}?</h2>
              <p>Tulisanmu tersimpan otomatis, jadi aman. Kamu bisa lanjut kapan saja.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.stay} onClick={onClose} autoFocus>Tetap di sini</button>
                <button type="button" className={styles.leave} onClick={leave}>Ya, keluar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
