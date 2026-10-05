import { CalendarClock, CreditCard, Repeat, type LucideIcon } from "lucide-react";
import { ReminderActions } from "@/components/reminder-actions";
import { dateLabel, money } from "@/lib/format";
import { daysUntil, dueLabel, urgency, type Reminder, type ReminderKind } from "@/lib/reminders";

const TONE = {
  overdue: "bg-rose-soft text-rose",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  later: "bg-track text-muted",
} as const;

export const KIND_ICON: Record<ReminderKind, LucideIcon> = { installment: CalendarClock, card: CreditCard, subscription: Repeat };

export function ReminderRow({ r, today, currency }: { r: Reminder; today: string; currency: string }) {
  const Icon = KIND_ICON[r.kind];
  const live = r.status === "active";
  const days = daysUntil(r.due_date, today);
  const tone = live ? urgency(days) : "later";
  const total = r.installments_total;
  const progress = total ? Math.min(100, (r.installments_paid / total) * 100) : 0;

  const detail =
    r.kind === "installment" && total
      ? `${r.installments_paid} of ${total} months paid · ${money(r.amount * (total - r.installments_paid), currency)} left`
      : r.kind === "subscription"
        ? `Monthly · ${r.status === "paused" ? "Paused" : "Active"}`
        : null;
  const badge = r.status === "completed" ? "Fully paid" : r.status === "paused" ? "Paused" : dueLabel(days);

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}><Icon size={16} /></span>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-semibold">{r.title}</p>
        <p className="truncate text-xs text-muted">{detail ? `${detail} · ` : ""}{live ? `Next ${dateLabel(r.due_date)}` : r.status === "completed" ? "Done" : `Was ${dateLabel(r.due_date)}`}</p>
        {r.kind === "installment" && total ? (
          <div className="mt-1.5 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={r.installments_paid} aria-label="Installments paid">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{badge}</span>
      <span className="w-28 text-right text-sm font-bold">{money(r.amount, currency)}</span>
      <ReminderActions r={r} />
    </li>
  );
}
