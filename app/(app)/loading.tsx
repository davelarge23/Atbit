import { Spinner } from "@/components/spinner";

const bar = "animate-pulse rounded-lg bg-track";

// Shown instantly while a page's data loads, so navigation never feels stuck.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-3">
        <div className={`${bar} h-9 w-56`} />
        <Spinner size={18} className="text-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${bar} h-28 !rounded-2xl`} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${bar} h-72 !rounded-2xl lg:col-span-2`} />
        <div className={`${bar} h-72 !rounded-2xl`} />
      </div>
    </div>
  );
}
