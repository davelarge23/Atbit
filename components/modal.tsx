"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Open modals, oldest first. Escape only closes the topmost one.
const stack: string[] = [];

export function Modal({ title, subtitle, onClose, children, layer = 60 }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; layer?: number }) {
  const id = useId();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    stack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === id) close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      stack.splice(stack.indexOf(id), 1);
      window.removeEventListener("keydown", onKey);
    };
  }, [id]);

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      style={{ zIndex: layer }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-card p-6 shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-track"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
