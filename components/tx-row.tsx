"use client";

import { Mic, Pencil } from "lucide-react";
import { useLog } from "@/components/log-dialog";
import { CATEGORY_META, type Transaction } from "@/lib/types";
import { dateLabel, money } from "@/lib/format";

export function CategoryTile({ category }: { category: Transaction["category"] }) {
  const m = CATEGORY_META[category];
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${m.tile}`}>
      {m.label.charAt(0)}
    </span>
  );
}

export function TxRow({ tx, currency, editable = true }: { tx: Transaction; currency: string; editable?: boolean }) {
  const { open } = useLog();
  const income = tx.type === "income";
  const savings = tx.type === "savings";
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <CategoryTile category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-semibold">
          {tx.description || CATEGORY_META[tx.category].label}
          {tx.source === "voice" && <Mic size={12} className="text-brand" aria-label="Logged by voice" />}
        </p>
        <p className="truncate text-xs text-muted">{CATEGORY_META[tx.category].label} · {dateLabel(tx.occurred_on)}</p>
      </div>
      <span className={`text-sm font-bold ${income ? "text-brand" : savings ? "text-sky" : ""}`}>{money(income ? tx.amount : -tx.amount, currency, { sign: true })}</span>
      {editable && (
        <button onClick={() => open("manual", tx)} aria-label="Edit transaction" className="rounded-full p-1.5 text-muted hover:bg-track hover:text-ink"><Pencil size={14} /></button>
      )}
    </li>
  );
}


