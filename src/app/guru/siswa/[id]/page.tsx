import { Suspense } from "react";
import { STUDENTS } from "@/lib/kelas";
import StudentDetail from "./StudentDetail";

// id contoh untuk mode lokal; di mode API id siswa (uuid) dirender saat diminta.
export function generateStaticParams() {
  return STUDENTS.map((s) => ({ id: s.id }));
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetail id={id} />;
}

// params dibaca di dalam <Suspense> supaya navigasi tetap instan (Next 16).
export default function SiswaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
