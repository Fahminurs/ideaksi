import { Lightbulb, MessageCircleQuestion, ClipboardList, ListTree, Sparkles, FileDown } from "lucide-react";

// 6 tahap menulis (wireframe v2). Warna tiap tahap: var(--stage-N), --stage-N-soft, --stage-N-ink.
export const STAGES = [
  { label: "Pilih topik", short: "Topik", icon: Lightbulb },
  { label: "Rumuskan pertanyaan", short: "Tanya", icon: MessageCircleQuestion },
  { label: "Fakta & sumber", short: "Fakta", icon: ClipboardList },
  { label: "Kerangka", short: "Kerangka", icon: ListTree },
  { label: "Draft & judul", short: "Draft", icon: Sparkles },
  { label: "Revisi & unduh", short: "Revisi", icon: FileDown },
];

// Variabel CSS warna tahap ke-n (1-6), untuk dipasang sebagai style inline.
export const stageVars = (n: number) =>
  ({
    "--stage": `var(--stage-${n})`,
    "--stage-soft": `var(--stage-${n}-soft)`,
    "--stage-ink": `var(--stage-${n}-ink)`,
  }) as React.CSSProperties;
