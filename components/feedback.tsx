"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type Kind = "success" | "error" | "info";
type ToastExtras = { details?: { label: string; value: string }[]; quote?: string; action?: { label: string; onClick: () => void } };
type ToastItem = { id: number; kind: Kind; message: string } & ToastExtras;
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; destructive?: boolean };

type Ctx = {
  toast: (message: string, kind?: Kind, extras?: ToastExtras) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const FeedbackContext = createContext<Ctx | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}

const STYLE: Record<Kind, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-brand" },
  error: { icon: XCircle, cls: "text-rose" },
  info: { icon: Info, cls: "text-sky" },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, kind: Kind = "success", extras: ToastExtras = {}) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, kind, message, ...extras }]);
      setTimeout(() => dismiss(id), extras.details || extras.action ? 9000 : kind === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })), []);

  const answer = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, cls } = STYLE[t.kind];
          return (
            <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm shadow-float">
              <Icon size={18} className={`mt-0.5 shrink-0 ${cls}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.message}</p>
                {t.quote && <p className="mt-0.5 truncate text-xs italic text-muted">“{t.quote}”</p>}
                {t.details && (
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-track px-3 py-2 text-xs">
                    {t.details.map((d) => (
                      <div key={d.label} className="contents">
                        <dt className="text-muted">{d.label}</dt>
                        <dd className="truncate text-right font-semibold">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {t.action && (
                  <button onClick={() => { t.action!.onClick(); dismiss(t.id); }} className="mt-2 text-xs font-semibold text-brand hover:underline">{t.action.label}</button>
                )}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink"><X size={14} /></button>
            </div>
          );
        })}
      </div>

      {pending && <ConfirmDialog {...pending} onAnswer={answer} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ title, message, confirmLabel, destructive, onAnswer }: ConfirmOpts & { onAnswer: (v: boolean) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onAnswer(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onAnswer]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onAnswer(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-float">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${destructive ? "bg-rose-soft text-rose" : "bg-brand-soft text-brand"}`}>
          <AlertTriangle size={18} />
        </span>
        <h2 id="confirm-title" className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => onAnswer(false)}>Cancel</button>
          <button autoFocus onClick={() => onAnswer(true)}
            className={destructive ? "inline-flex items-center justify-center rounded-lg bg-rose px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90" : "btn-primary"}>
            {confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}