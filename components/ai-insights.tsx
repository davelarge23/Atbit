"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

type Result = { summary: string; highlights: { tone: "good" | "warn" | "tip"; text: string }[] };
const TONE = {
  good: "bg-brand-soft text-brand",
  warn: "bg-rose-soft text-rose",
  tip: "bg-sky-soft text-sky",
} as const;
const LABEL = { good: "Going well", warn: "Watch out", tip: "Tip" } as const;

export function AiInsights({ cacheKey }: { cacheKey: string }) {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (force: boolean) => {
      void force;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/insights", { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Couldn't load insights.");
        sessionStorage.setItem(cacheKey, JSON.stringify(json));
        setData(json);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Couldn't load insights.");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    // Only restores a previously generated summary; never calls the AI on its own.
    const stored = sessionStorage.getItem(cacheKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setData(JSON.parse(stored));
  }, [cacheKey]);

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Sparkles size={18} className="text-brand" /> AI budget summary</h2>
          <p className="text-sm text-muted">A plain-language read on this month, generated from your transactions.</p>
        </div>
        {data && (
          <button onClick={() => load(true)} disabled={loading} aria-label="Regenerate insights" className="btn-secondary !px-3 !py-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      {!data && !loading && (
        <button onClick={() => load(true)} className="btn-primary mt-5"><Sparkles size={16} /> Generate insights</button>
      )}
      {loading && !data && <p className="mt-5 flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" /> Analyzing your month…</p>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-track px-4 py-3 text-sm text-muted">{error}</p>}
      {data && (
        <div className="mt-5 flex flex-col gap-4" aria-live="polite">
          <p className="text-[15px] leading-6">{data.summary}</p>
          <ul className="flex flex-col gap-2">
            {data.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[h.tone]}`}>{LABEL[h.tone]}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">AI-generated guidance, not professional financial advice.</p>
        </div>
      )}
    </section>
  );
}
