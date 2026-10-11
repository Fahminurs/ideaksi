"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Hand, LogOut } from "lucide-react";
import { logout } from "@/lib/session";
import styles from "./LogoutButton.module.css";

// Tombol Keluar + dialog konfirmasi. Setelah dikonfirmasi layar "Sampai jumpa" langsung tampil
// (tanpa spinner) sementara sesi dihapus di belakang; layout lalu mengalihkan ke /masuk.
export default function LogoutButton({
  name,
  className,
  title,
  children,
}: {
  name?: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const stayRef = useRef<HTMLButtonElement>(null);
  const first = name?.trim().split(/\s+/)[0];

  useEffect(() => {
    if (!open) return;
    stayRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function confirm() {
    setLeaving(true);
    setOpen(false);
    logout();
  }

  return (
    <>
      <button type="button" className={className} title={title} onClick={() => setOpen(true)}>
        {children}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {open && (
                <motion.div
                  key="scrim"
                  className={styles.scrim}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="logout-title"
                    aria-describedby="logout-desc"
                    className={styles.card}
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.badge} aria-hidden>
                      <span className={styles.ring} />
                      <Hand size={34} className={styles.wave} />
                    </div>
                    <h2 id="logout-title">Mau istirahat dulu{first ? `, ${first}` : ""}?</h2>
                    <p id="logout-desc">Tulisanmu sudah tersimpan. Kamu bisa lanjut kapan saja.</p>
                    <div className={styles.actions}>
                      <button ref={stayRef} type="button" className={styles.stay} onClick={() => setOpen(false)}>
                        Tetap di sini
                      </button>
                      <button type="button" className={styles.leave} onClick={confirm}>
                        <LogOut size={18} aria-hidden /> Ya, keluar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              {leaving && (
                <motion.div
                  key="bye"
                  className={styles.bye}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  role="status"
                >
                  <Hand size={56} className={styles.wave} aria-hidden />
                  <strong>Sampai jumpa{first ? `, ${first}` : ""}!</strong>
                  <span>Terus berkarya ya ✨</span>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionConfig>,
          document.body,
        )}
    </>
  );
}
