import { Loader2 } from "lucide-react";

export function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return <Loader2 size={size} aria-hidden className={`shrink-0 animate-spin ${className}`} />;
}

/** Button content that swaps in a spinner and a progress label while busy. */
export function BusyLabel({ busy, label, busyLabel }: { busy: boolean; label: React.ReactNode; busyLabel?: string }) {
  return busy ? (
    <span className="inline-flex items-center justify-center gap-1.5">
      <Spinner />
      <span>{busyLabel ?? "Saving…"}</span>
    </span>
  ) : (
    <>{label}</>
  );
}
