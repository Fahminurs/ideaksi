import Image from "next/image";
import Notebook from "./Notebook";
import RedirectIfLoggedIn from "./RedirectIfLoggedIn";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <RedirectIfLoggedIn />
      <ThemeToggle className={styles.themeBtn} />
      <Notebook />
      <section className={styles.formSide}>
        <div className={styles.formCol}>
          <Image
            src="/logo-full.png"
            alt="Ideaksi, dari ide menjadi aksi"
            width={562}
            height={518}
            className={styles.logo}
            priority
          />
          {children}
        </div>
      </section>
    </main>
  );
}
