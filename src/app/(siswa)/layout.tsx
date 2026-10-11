"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import {
  House, PenLine, BookOpen, FileText, CircleHelp, LogOut,
  PanelLeftClose, PanelLeftOpen, Sparkles,
} from "lucide-react";
import { logout, rememberPath } from "@/lib/session";
import { apiEnabled } from "@/lib/api";
import { pullAll } from "@/lib/sync";
import { useUser } from "@/lib/useUser";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./siswa.module.css";

const SIDEBAR = [
  { href: "/beranda", label: "Beranda", icon: House },
  { href: "/menulis", label: "Menulis", icon: PenLine },
  { href: "/materi", label: "Materi", icon: BookOpen },
  { href: "/contoh", label: "Contoh artikel", icon: FileText },
  { href: "/kuis", label: "Kuis", icon: CircleHelp },
];

const BOTTOM_NAV = [
  { href: "/beranda", label: "Beranda", icon: House },
  { href: "/menulis", label: "Tulis", icon: PenLine },
  { href: "/materi", label: "Materi", icon: BookOpen },
  { href: "/kuis", label: "Kuis", icon: CircleHelp },
];
// Profil dibuka lewat avatar di header; slot tengah bottom nav dipakai tombol Tanya Dea.

// usePathname() harus di dalam <Suspense> (Next 16, rute dinamis). Fallback = menu tanpa sorotan.
function WithPath({ children }: { children: (pathname: string) => React.ReactNode }) {
  return children(usePathname());
}

function PathMemory({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    if (enabled) rememberPath(pathname);
  }, [enabled, pathname]);
  return null;
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

function SidebarLinks({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav aria-label="Menu utama">
      {SIDEBAR.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={styles.navItem}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          title={collapsed ? label : undefined}
        >
          <Icon size={20} aria-hidden /> <span className={styles.label}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function AiCard({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <Link
      href="/tanya-dea"
      className={styles.aiCard}
      aria-current={isActive(pathname, "/tanya-dea") ? "page" : undefined}
      title={collapsed ? "Tanya Dea" : undefined}
    >
      <span className={styles.aiCardIcon} aria-hidden><Sparkles size={20} /></span>
      <span className={`${styles.aiCardText} ${styles.label}`}>
        <strong>Tanya Dea</strong>
        <small>Asisten menulismu</small>
      </span>
    </Link>
  );
}

function BottomLinks({ pathname }: { pathname: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <nav className={styles.bottomNav} aria-label="Menu utama">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }, i) => {
          // tab Materi juga menyala di Contoh artikel (di HP keduanya satu tab, dipisah lewat BelajarTabs)
          const active = isActive(pathname, href) || (href === "/materi" && isActive(pathname, "/contoh"));
          return (
            <Fragment key={href}>
              {i === 2 && (
                <Link
                  href="/tanya-dea"
                  className={styles.aiTab}
                  aria-current={isActive(pathname, "/tanya-dea") ? "page" : undefined}
                >
                  <span className={styles.aiOrb}><Sparkles size={24} aria-hidden /></span>
                  <span className={styles.tabLabel}>Tanya Dea</span>
                </Link>
              )}
              <Link href={href} className={styles.tab} aria-current={active ? "page" : undefined}>
                <span className={styles.tabIcon}>
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className={styles.pill}
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon size={22} aria-hidden />
                </span>
                <span className={styles.tabLabel}>{label}</span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </MotionConfig>
  );
}

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();
  // ponytail: tidak diingat antar reload; simpan di localStorage kalau diminta
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (user === null || user?.role === "guru") router.replace("/masuk");
  }, [user, router]);

  // Mode API: segarkan cache dari server sekali tiap aplikasi dibuka (mis. setelah menulis di perangkat lain)
  const siswaName = user?.role === "siswa" ? user.username : null;
  useEffect(() => {
    if (apiEnabled && siswaName) pullAll().catch((e) => console.warn("[ideaksi] sinkron gagal:", e.message));
  }, [siswaName]);

  // Semua selalu dirender (perlu untuk validasi instant navigation); yang belum login dialihkan oleh effect di atas.
  const siswa = user?.role === "siswa" ? user : null;
  const name = siswa?.name ?? "";

  return (
    <div className={styles.shell} data-collapsed={collapsed || undefined}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <Link href="/beranda" className={styles.brand} aria-label="Ideaksi, beranda">
            <Image src="/logo.png" alt="" width={44} height={34} />
            <span className={styles.label}>IDEA<b>KSI</b></span>
          </Link>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Lebarkan menu" : "Ciutkan menu"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <Suspense fallback={<SidebarLinks pathname="" collapsed={collapsed} />}>
          <WithPath>{(p) => <SidebarLinks pathname={p} collapsed={collapsed} />}</WithPath>
        </Suspense>

        <div className={styles.sidebarFoot}>
          <Suspense fallback={<AiCard pathname="" collapsed={collapsed} />}>
            <WithPath>{(p) => <AiCard pathname={p} collapsed={collapsed} />}</WithPath>
          </Suspense>

          <div className={styles.userCard}>
            <Link href="/profil" className={styles.userRow} title="Lihat profil">
              <span className={`${styles.avatar} ${styles.avatarSm}`} aria-hidden>{initials(name)}</span>
              <span className={`${styles.userText} ${styles.label}`}>
                <strong title={name}>{name}</strong>
                <small>Kelas VIII · Lihat profil</small>
              </span>
            </Link>
            <div className={styles.userActions}>
              <ThemeToggle withLabel short className={styles.miniBtn} labelClassName={styles.label} />
              <button type="button" className={styles.miniBtn} onClick={logout} title={collapsed ? "Keluar" : undefined}>
                <LogOut size={16} aria-hidden /> <span className={styles.label}>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <Link href="/beranda" className={styles.brand}>
          <Image src="/logo.png" alt="" width={36} height={28} />
          <span>IDEA<b>KSI</b></span>
        </Link>
        <div className={styles.headerActions}>
          <ThemeToggle className={styles.iconBtn} />
          <Link href="/profil" className={styles.avatar} aria-label="Profil">
            {initials(name)}
          </Link>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <Suspense fallback={<BottomLinks pathname="" />}>
        <WithPath>{(p) => <BottomLinks pathname={p} />}</WithPath>
      </Suspense>
      <Suspense fallback={null}>
        <PathMemory enabled={user?.role === "siswa"} />
      </Suspense>
    </div>
  );
}
