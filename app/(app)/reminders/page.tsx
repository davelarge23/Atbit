import type { Metadata } from "next";
import { AddReminder } from "@/components/add-reminder";
import { CardActions } from "@/components/card-actions";
import { KIND_ICON, ReminderRow } from "@/components/reminder-row";
import { dateLabel, money } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { addDaysISO, KIND_META, KINDS, nextOccurrence, ordinal, REMIND_DAYS, todayPH, type CreditCard, type Reminder, type ReminderKind } from "@/lib/reminders";

export const metadata: Metadata = { title: "Reminders" };

const sum = (list: Reminder[]) => list.reduce((s, r) => s + r.amount, 0);

export default async function RemindersPage() {
  const { supabase, profile } = await requireUser();
  const cur = profile.currency;
  const [remindersRes, cardsRes] = await Promise.all([
    supabase.from("reminders").select("*").order("due_date", { ascending: true }),
    supabase.from("credit_cards").select("id, name, due_day").order("created_at", { ascending: true }),
  ]);
  const reminders = ((remindersRes.data ?? []) as Reminder[]).map((r) => ({ ...r, amount: Number(r.amount) }));
  const cards = (cardsRes.data ?? []) as CreditCard[];
  const today = todayPH();
  const horizon = addDaysISO(today, REMIND_DAYS);

  const of = (k: ReminderKind) => reminders.filter((r) => r.kind === k);
  const live = (k: ReminderKind) => of(k).filter((r) => r.status === "active");
  const subtitle: Record<ReminderKind, string> = { installment: "paid each month", card: "outstanding", subscription: "per month" };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-muted">Installments, credit cards and subscriptions. You&apos;re reminded {REMIND_DAYS} days before each due date, here and on your dashboard.</p>
        </div>
        <AddReminder currency={cur} today={today} cards={cards} />
      </div>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Summary">
        {KINDS.map((k) => {
          const active = live(k);
          const soon = active.filter((r) => r.due_date <= horizon);
          return (
            <div key={k} className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{KIND_META[k].plural}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{money(sum(active), cur)}</p>
              <p className="text-xs text-muted">{active.length} active · {subtitle[k]}</p>
              <p className={`mt-2 text-xs font-semibold ${soon.length ? "text-rose" : "text-muted"}`}>
                {soon.length ? `${soon.length} due soon · ${money(sum(soon), cur)}` : `Nothing due in ${REMIND_DAYS} days`}
              </p>
            </div>
          );
        })}
      </section>

      <Section kind="installment" empty="No installments yet. Add one to track how many months you've paid.">
        {of("installment").map((r) => <ReminderRow key={r.id} r={r} today={today} currency={cur} />)}
      </Section>

      <section className="card p-6" aria-label="Credit cards">
        <SectionTitle kind="card" count={of("card").length} />
        {cards.length ? (
          <div className="mt-3 flex flex-col gap-5">
            {cards.map((c) => {
              const items = of("card").filter((r) => r.card_id === c.id);
              return (
                <div key={c.id} className="rounded-xl border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted">Due every {ordinal(c.due_day)} · next {dateLabel(nextOccurrence(today, c.due_day))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{money(sum(items), cur)}</span>
                      <CardActions id={c.id} name={c.name} canPay={items.length > 0} />
                    </div>
                  </div>
                  {items.length ? (
                    <ul className="mt-1">{items.map((r) => <ReminderRow key={r.id} r={r} today={today} currency={cur} />)}</ul>
                  ) : (
                    <p className="py-3 text-xs text-muted">No open items on this card.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No cards yet. Choose “Credit card” under Add item to set one up.</p>
        )}
      </section>

      <Section kind="subscription" empty="No subscriptions yet.">
        {of("subscription").map((r) => <ReminderRow key={r.id} r={r} today={today} currency={cur} />)}
      </Section>
    </div>
  );
}

function SectionTitle({ kind, count }: { kind: ReminderKind; count: number }) {
  const Icon = KIND_ICON[kind];
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <Icon size={18} className="text-muted" /> {KIND_META[kind].plural}
      <span className="rounded-full bg-track px-2 py-0.5 text-[11px] font-semibold text-muted">{count}</span>
    </h2>
  );
}

function Section({ kind, empty, children }: { kind: ReminderKind; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="card p-6" aria-label={KIND_META[kind].plural}>
      <SectionTitle kind={kind} count={children.length} />
      {children.length ? <ul className="mt-2">{children}</ul> : <p className="py-10 text-center text-sm text-muted">{empty}</p>}
    </section>
  );
}
