import type { Metadata } from "next";
import { AiInsights } from "@/components/ai-insights";
import { firstOfMonth, money, monthLabel, parseMonth, pct, shiftMonth } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Insights" };

const TIPS = [
  ["Pay yourself first", "Move your savings share out the day income lands, so spending only ever uses what's left."],
  ["Attack high-interest debt", "Anything above savings-account interest is a guaranteed return when you pay it down early."],
  ["Name your wants", "Wants aren't bad — capping them at 30% lets you enjoy them without guilt."],
  ["Review monthly", "A 10-minute look at last month's categories catches drift before it becomes a habit."],
];

export default async function InsightsPage() {
  const { supabase, profile } = await requireUser();
  const cur = profile.currency;
  const now = parseMonth();
  const next = shiftMonth(now.year, now.month, 1);
  const [{ data }, { data: rems }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, category")
      .neq("funds_source", "card")
      .gte("occurred_on", firstOfMonth(now.year, now.month))
      .lt("occurred_on", firstOfMonth(next.year, next.month)),
    supabase.from("reminders").select("amount, status"),
  ]);

  const rows = data ?? [];
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const spend = (cats: string[]) => rows.filter((r) => r.type === "expense" && cats.includes(r.category)).reduce((s, r) => s + Number(r.amount), 0);
  const needs = spend(["groceries", "utilities", "debts"]);
  const wants = spend(["subscriptions", "leisure", "other"]);
  const savings = rows.filter((r) => r.type === "savings").reduce((s, r) => s + Number(r.amount), 0);

  const buckets = [
    { name: "Needs", target: 50, actual: needs, note: "Groceries, utilities, debts", color: "bg-sky" },
    { name: "Wants", target: 30, actual: wants, note: "Subscriptions, leisure & other", color: "bg-purple-500" },
    { name: "Savings", target: 20, actual: savings, note: "Logged savings", color: "bg-brand" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted">Budget rules and how your {monthLabel(now.year, now.month)} measures up.</p>
      </div>

      <AiInsights cacheKey={`ai-insights-${now.key}-${rows.length}-${Math.round(income + needs + wants + savings)}-${(rems ?? []).length}-${Math.round((rems ?? []).reduce((s, r) => s + Number(r.amount), 0))}`} />

      <section className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">The 50 / 30 / 20 rule</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Split after-tax income into 50% needs, 30% wants and 20% savings or debt payoff. It&apos;s a starting point, not a law — adjust to your life.
        </p>
        {income > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {buckets.map((b) => {
              const share = (b.actual / income) * 100;
              const over = b.name !== "Savings" ? share > b.target : share < b.target;
              return (
                <div key={b.name}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-xs text-muted">target {b.target}%</span>
                  </div>
                  <p className="text-2xl font-bold">{pct(share, 0)}</p>
                  <div className="my-2 h-2 overflow-hidden rounded-full bg-track">
                    <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted">{money(b.actual, cur)} · {b.note}</p>
                  <p className={`mt-1 text-xs font-semibold ${over ? "text-rose" : "text-brand"}`}>{over ? (b.name === "Savings" ? "Below target" : "Over target") : "On track"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-track px-4 py-3 text-sm text-muted">Log some income this month to see how you compare.</p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {TIPS.map(([title, body]) => (
          <div key={title} className="card p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
