"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { endServerSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./guru.module.css";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) endServerSession().finally(() => router.replace("/masuk"));
    else if (user?.role === "siswa") router.replace("/beranda");
  }, [user, router]);

  // Selalu render children (validasi instant navigation); yang bukan guru dialihkan effect di atas.
  const name = user?.role === "guru" ? user.name : "";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/guru/beranda" className={styles.brand} aria-label="Ideaksi, dashboard guru">
          <Image src="/logo.png" alt="" width={40} height={31} />
          <span className={styles.brandText}>IDEA<b>KSI</b></span>
          <span className={styles.roleChip}>Guru</span>
        </Link>
        <div className={styles.headerActions}>
          <span className={styles.teacher}>{name}</span>
          <ThemeToggle className={styles.iconBtn} />
          <LogoutButton name={name} className={styles.logout}>
            <LogOut size={18} aria-hidden /> <span>Keluar</span>
          </LogoutButton>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
