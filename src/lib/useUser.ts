"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readSession, subscribeSession, type User } from "./session";

// undefined = belum tahu (render server / hydrasi), null = belum login.
export function useUser(): User | null | undefined {
  const raw = useSyncExternalStore(subscribeSession, readSession, () => undefined);
  return useMemo(() => (raw ? (JSON.parse(raw) as User) : raw === null ? null : undefined), [raw]);
}
