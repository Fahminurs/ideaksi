"use client";

// Shortcut login untuk development. Hanya tampil saat `npm run dev`.
// Tampil di semua halaman (root layout) dan bisa digeser lewat pegangan "DEV".
// Hapus file ini + <DevLogin /> di app/layout.tsx + devLogin() di session.ts setelah selesai.
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { devLogin, type Role } from "@/lib/session";

type Pos = { x: number; y: number };
const KEY = "ideaksi_dev_pos";

const noop = () => () => {};
const parse = (raw: string | null): Pos | null => {
  try {
    return JSON.parse(raw ?? "null");
  } catch {
    return null;
  }
};

export default function DevLogin() {
  const router = useRouter();
  // posisi saat sedang/selesai digeser di sesi ini; null = pakai posisi tersimpan atau bawaan (kiri tengah)
  const [pos, setPos] = useState<Pos | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // posisi tersimpan; server = null supaya tidak beda saat hidrasi
  const savedRaw = useSyncExternalStore(noop, () => localStorage.getItem(KEY), () => null);

  if (process.env.NODE_ENV !== "development") return null;

  const go = async (role: Role) => {
    const err = await devLogin(role);
    if (err) return alert(err);
    router.replace(role === "guru" ? "/guru/beranda" : "/beranda");
  };

  const onDown = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = box.current!.getBoundingClientRect();
    setPos({
      x: Math.min(Math.max(0, e.clientX - drag.current.dx), innerWidth - r.width),
      y: Math.min(Math.max(0, e.clientY - drag.current.dy), innerHeight - r.height),
    });
  };

  const onUp = () => {
    drag.current = null;
    try {
      if (pos) localStorage.setItem(KEY, JSON.stringify(pos));
    } catch {}
  };

  const p = pos ?? parse(savedRaw);

  return (
    <div
      ref={box}
      style={{
        position: "fixed", zIndex: 50, display: "flex", flexDirection: "column", gap: 6, padding: 6,
        borderRadius: 12, background: "#111827", boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        // jaga tetap di dalam layar (mis. posisi disimpan di desktop lalu dibuka di HP)
        ...(p ? { left: Math.min(p.x, innerWidth - 80), top: Math.min(p.y, innerHeight - 140) } : { left: 0, top: "50%", transform: "translateY(-50%)" }),
      }}
    >
      <span
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        title="Geser"
        style={{
          alignSelf: "stretch", textAlign: "center", padding: "4px 0", color: "#9CA3AF",
          fontSize: 10, fontWeight: 700, cursor: "grab", touchAction: "none", userSelect: "none",
        }}
      >
        ⠿ DEV
      </span>
      {(["siswa", "guru"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => go(r)}
          style={{
            minHeight: 36, padding: "0 10px", border: "none", borderRadius: 8,
            background: r === "siswa" ? "#2196F3" : "#FFB300", color: r === "siswa" ? "white" : "#111827",
            fontWeight: 700, fontSize: 13,
          }}
        >
          {r === "siswa" ? "Siswa" : "Guru"}
        </button>
      ))}
    </div>
  );
}
