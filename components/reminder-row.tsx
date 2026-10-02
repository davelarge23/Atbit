import { Bell } from "lucide-react";
import { ReminderActions } from "@/components/reminder-actions";
import { dateLabel, money } from "@/lib/format";
import { daysUntil, dueLabel, urgency, type Reminder } from "@/lib/reminders";

const TONE = {
  overdue: "bg-rose-soft text-rose",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  later: "bg-track text-muted",
} as const;

export function ReminderRow({ r, today, currency, manage = false }: { r: Reminder; today: string; currency: string; manage?: boolean }) {
  const days = daysUntil(r.due_date, today);
  const tone = urgency(days);
  const progress =
    r.installments_total !== null ? `Installment ${r.installments_paid + 1} of ${r.installments_total}` : r.recurrence === "monthly" ? "Monthly" : "One-time";

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}><Bell size={16} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{r.title}</p>
        <p className="truncate text-xs text-muted">{progress} · {dateLabel(r.due_date)}</p>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{dueLabel(days)}</span>
      <span className="w-28 text-right text-sm font-bold">{money(r.amount, currency)}</span>
      <ReminderActions id={r.id} title={r.title} manage={manage} />
    </li>
  );
}