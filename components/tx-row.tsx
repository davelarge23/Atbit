"use client";

import { CreditCard, HandCoins, Mic, Pencil, Repeat } from "lucide-react";
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

const CHIP = "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold";

/** Small tag showing where a transaction came from (loan, card charge, reminder payment). */
function SourceChip({ tx }: { tx: Transaction }) {
  if (tx.origin === "loan") return <span className={`${CHIP} bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300`}><HandCoins size={10} />Loan</span>;
  if (tx.origin === "card") return <span className={`${CHIP} bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300`}><CreditCard size={10} />On card</span>;
  if (tx.origin === "payment") return <span className={`${CHIP} bg-brand-soft text-brand`}><Repeat size={10} />Reminder payment</span>;
  return null;
}

export function TxRow({ tx, currency, editable = true }: { tx: Transaction; currency: string; editable?: boolean }) {
  const { open } = useLog();
  const income = tx.type === "income";
  const savings = tx.type === "savings";
  const onCard = tx.funds_source === "card";
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <CategoryTile category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="truncate">{tx.description || CATEGORY_META[tx.category].label}</span>
          <SourceChip tx={tx} />
          {tx.source === "voice" && <Mic size={12} className="shrink-0 text-brand" aria-label="Logged by voice" />}
        </p>
        <p className="truncate text-xs text-muted">
          {CATEGORY_META[tx.category].label} · {dateLabel(tx.occurred_on)}
          {tx.detail ? ` · ${tx.detail}` : ""}
        </p>
      </div>
      <span
        className={`text-sm font-bold ${income ? "text-brand" : savings ? "text-sky" : onCard ? "text-muted" : ""}`}
        title={onCard ? "Charged to a card: not deducted from cash until the card is paid" : undefined}
      >
        {money(income ? tx.amount : -tx.amount, currency, { sign: true })}
      </span>
      {editable && (
        <button onClick={() => open("manual", tx)} aria-label="Edit transaction" className="rounded-full p-1.5 text-muted hover:bg-track hover:text-ink"><Pencil size={14} /></button>
      )}
    </li>
  );
}
