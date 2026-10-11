"use client";

import { useEffect } from "react";
import { markRead } from "@/lib/materiProgress";

// Catat bab ini sebagai sudah dibaca (untuk progres di Beranda).
export default function MarkRead({ slug }: { slug: string }) {
  useEffect(() => markRead(slug), [slug]);
  return null;
}
