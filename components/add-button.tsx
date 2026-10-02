"use client";

import { useLog } from "@/components/log-dialog";

export function AddButton({ children }: { children: React.ReactNode }) {
  const { open } = useLog();
  return <button onClick={() => open("manual")} className="btn-primary">{children}</button>;
}
