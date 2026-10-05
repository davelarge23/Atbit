import Link from "next/link";
import { KIND_ICON } from "@/components/reminder-row";
import { dateLabel, money } from "@/lib/format";
import { daysUntil, dueLabel, KIND_META, KINDS, REMIND_DAYS, urgency, type Reminder } from "@/lib/reminders";

const TONE = {
  overdue: "bg-rose-soft text-rose",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  later: "bg-track text-muted",
} as const;

/** Dashboard reminders: one total per category instead of every individual item. */
export function ReminderSummary({ due, today, currency }: { due: Pick<Reminder, "kind" | "amount" | "due_date">[]; today: string; currency: string }) {
  const groups = KINDS.map((kind) => {
    const items = due.filter((r) => r.kind === kind).sort((a, b) => a.due_date.localeCompare(b.due_date));
    return { kind, items, total: items.reduce((s, r) => s + r.amount, 0), first: items[0] };
  }).filter((g) => g.items.length);
  const overdue = due.filter((r) => daysUntil(r.due_date, today) < 0).length;

  return (
    <section className={`card p-5 ${overdue ? "border-rose" : ""}`} aria-label="Reminders">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            Reminders
            {due.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${overdue ? "bg-rose-soft text-rose" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"}`}>
                {overdue ? `${overdue} overdue` : `${due.length} due soon`}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted">{due.length ? `Payments due within the next ${REMIND_DAYS} days.` : `Nothing due in the next ${REMIND_DAYS} days.`}</p>
        </div>
        <Link href="/reminders" className="text-sm font-semibold text-brand hover:underline">Manage →</Link>
      </div>
      {groups.length > 0 && (
        <ul className="mt-2">
          {groups.map(({ kind, items, total, first }) => {
            const Icon = KIND_ICON[kind];
            const days = daysUntil(first.due_date, today);
            const tone = urgency(days);
            return (
              <li key={kind} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}><Icon size={16} /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-semibold">{KIND_META[kind].plural}</p>
                  <p className="truncate text-xs text-muted">{items.length} due · earliest {dateLabel(first.due_date)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{dueLabel(days)}</span>
                <span className="w-28 text-right text-sm font-bold">{money(total, currency)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
