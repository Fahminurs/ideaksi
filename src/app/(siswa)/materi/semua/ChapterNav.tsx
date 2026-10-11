"use client";

// Chip A–I yang menempel di atas saat scroll; chip bab yang sedang dibaca menyala.
import { useEffect, useState } from "react";
import { stageVars } from "@/lib/stages";
import { markRead } from "@/lib/materiProgress";
import styles from "../materi.module.css";

type Item = { slug: string; title: string; stage: number };

export default function ChapterNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0].slug);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = window.innerWidth < 768 ? 180 : 140;
      let current = items[0].slug;
      for (const { slug } of items) {
        const el = document.getElementById(slug);
        if (el && el.getBoundingClientRect().top <= offset) current = slug;
      }
      setActive(current);
      markRead(current); // bab yang sedang di layar dihitung sudah dibaca
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav className={styles.jumpNav} aria-label="Lompat ke bab">
      {items.map((it, i) => (
        <a
          key={it.slug}
          href={`#${it.slug}`}
          title={it.title}
          style={stageVars(it.stage)}
          aria-current={active === it.slug ? "location" : undefined}
        >
          {String.fromCharCode(65 + i)}
        </a>
      ))}
    </nav>
  );
}
