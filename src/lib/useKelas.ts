"use client";

// Data kelas untuk guru. Mode API: dari server (view student_progress). Mode lokal: data contoh di kelas.ts.
import { useEffect, useState } from "react";
import { apiEnabled, call } from "./api";
import { STUDENTS, type Student } from "./kelas";

type Loaded<T> = { data?: T; error?: string };

export function useStudents(): Loaded<Student[]> {
  const [state, setState] = useState<Loaded<Student[]>>(apiEnabled ? {} : { data: STUDENTS });
  useEffect(() => {
    if (!apiEnabled) return;
    call<Student[]>("guru.students")
      .then((data) => setState({ data }))
      .catch((e: Error) => setState({ error: e.message }));
  }, []);
  return state;
}

export function useStudent(id: string): Loaded<Student | null> {
  const [state, setState] = useState<Loaded<Student | null>>(
    apiEnabled ? {} : { data: STUDENTS.find((s) => s.id === id) ?? null },
  );
  useEffect(() => {
    if (!apiEnabled) return;
    call<Student>("guru.student", { id })
      .then((data) => setState({ data }))
      .catch((e: Error) => setState({ error: e.message }));
  }, [id]);
  return state;
}
