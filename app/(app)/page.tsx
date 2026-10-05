import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { Greeting, QuickLogBar, VoicePanel } from "@/components/dashboard-bits";
import { TxRow } from "@/components/tx-row";
import { firstOfMonth, money, monthLabel, parseMonth, pct, shiftMonth } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { ReminderSummary } from "@/components/reminder-summary";
import { addDaysISO, REMIND_DAYS, todayPH, type Reminder } from "@/lib/reminders";
import { EXPENSE_CATEGORIES, type Category, type Transaction } from "@/lib/types";

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const { year, month } = parseMonth(typeof sp.m === "string" ? sp.m : undefined);
  const { supabase, profile } = await requireUser();
  const cur = profile.currency;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const today = todayPH();
  const [remindersRes, yearRows, recent, carry] = await Promise.all([
    supabase.from("reminders").select("kind, amount, due_date").eq("status", "active").lte("due_date", addDaysISO(today, REMIND_DAYS)),
    supabase
      .from("transactions")
      .select("type, amount, category, occurred_on")
      .gte("occurred_on", firstOfMonth(prev.year, prev.month) < `${year}-01-01` ? firstOfMonth(prev.year, prev.month) : `${year}-01-01`)
      .lt("occurred_on", `${year + 1}-01-01`),
    supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(6),
    supabase.rpc("carryover_balance", { p_month: firstOfMonth(year, month) }),
  ]);

  const due = ((remindersRes.data ?? []) as Pick<Reminder, "kind" | "amount" | "due_date">[]).map((r) => ({ ...r, amount: Number(r.amount) }));

  const rows = (yearRows.data ?? []) as Pick<Transaction, "type" | "amount" | "category" | "occurred_on">[];
  const inMonth = (r: { occurred_on: string }, y: number, m: number) => r.occurred_on.startsWith(`${y}-${String(m).padStart(2, "0")}`);
  const sum = (list: typeof rows, type: "income" | "expense" | "savings") => list.reduce((s, r) => s + (r.type === type ? Number(r.amount) : 0), 0);

  const thisMonth = rows.filter((r) => inMonth(r, year, month));
  const lastMonth = rows.filter((r) => inMonth(r, prev.year, prev.month));
  const income = sum(thisMonth, "income");
  const expenses = sum(thisMonth, "expense");
  const prevIncome = sum(lastMonth, "income");
  const prevExpenses = sum(lastMonth, "expense");
  const saved = sum(thisMonth, "savings");
  const net = income - expenses - saved;
  const opening = Number(carry.data ?? profile.starting_balance);
  const closing = opening + net;

  const change = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    category: c as Category,
    amount: thisMonth.filter((r) => r.type === "expense" && r.category === c).reduce((s, r) => s + Number(r.amount), 0),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const budgetUsed = profile.monthly_budget > 0 ? (expenses / profile.monthly_budget) * 100 : 0;
  const goalUsed = profile.savings_goal > 0 ? (saved / profile.savings_goal) * 100 : 0;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Personal vault · live financial health
          </p>
          <Greeting name={profile.display_name} />
          <p className="mt-1 text-sm text-muted">Here is your automated financial flow for this cycle.</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-xl border border-line bg-card p-1 md:self-auto" aria-label="Month">
          <Link href={`/?m=${prev.key}`} aria-label="Previous month" className="rounded-lg p-2 hover:bg-track"><ChevronLeft size={16} /></Link>
          <span className="min-w-32 text-center text-sm font-semibold">{monthLabel(year, month)}</span>
          <Link href={`/?m=${next.key}`} aria-label="Next month" className="rounded-lg p-2 hover:bg-track"><ChevronRight size={16} /></Link>
        </div>
      </section>

      <QuickLogBar />

      <ReminderSummary due={due} today={today} currency={cur} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total income" accent="text-brand" value={money(income, cur)} trend={change(income, prevIncome)} good="up" sub={`vs. ${money(prevIncome, cur)} last month`} />
        <Stat label="Total expenses" accent="text-rose" value={money(expenses, cur)} trend={change(expenses, prevExpenses)} good="down"
          sub={income > 0 ? `${pct((expenses / income) * 100)} of income` : "No income logged yet"}
          bar={profile.monthly_budget > 0 ? { label: "Budget ceiling", right: money(profile.monthly_budget, cur, { compact: true }), pct: budgetUsed, color: budgetUsed > 100 ? "bg-rose" : "bg-brand" } : undefined} />
        <Stat label="Total savings" value={money(saved, cur)} accent="text-brand"
          pill={income > 0 ? `${pct(savingsRate, 0)} of income` : undefined}
          sub={profile.savings_goal > 0 ? `${pct(Math.max(goalUsed, 0), 0)} of ${money(profile.savings_goal, cur)} goal` : "Log savings or set a goal in Settings"}
          bar={profile.savings_goal > 0 ? { label: "Savings goal", right: money(profile.savings_goal, cur, { compact: true }), pct: goalUsed, color: "bg-brand-strong" } : undefined} />
        <Stat label="Balance" value={money(closing, cur)} accent={closing >= 0 ? undefined : "text-rose"}
          sub={`Carried over: ${money(opening, cur)} · ${money(net, cur, { sign: true })} this month`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Cash flow breakdown</h2>
          <p className="mb-4 text-sm text-muted">Inflow, outflow and retained capital.</p>
          <CashFlowChart data={rows.map((r) => ({ type: r.type, amount: Number(r.amount), occurred_on: r.occurred_on }))} year={year} month={month} currency={cur} />
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <p className="mb-4 text-sm text-muted">Current {money(expenses, cur)} allocation</p>
          <CategoryBreakdown items={byCat} total={expenses} currency={cur} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <VoicePanel />
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
              <p className="text-sm text-muted">Your latest logged items.</p>
            </div>
            <Link href="/transactions" className="text-sm font-semibold text-brand hover:underline">View full ledger →</Link>
          </div>
          {recent.data?.length ? (
            <ul className="mt-2">{(recent.data as Transaction[]).map((t) => <TxRow key={t.id} tx={{ ...t, amount: Number(t.amount) }} currency={cur} />)}</ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Nothing yet — log your first transaction with your voice.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, trend, good, accent, pill, bar }: {
  label: string; value: string; sub: string; trend?: number | null; good?: "up" | "down"; accent?: string; pill?: string;
  bar?: { label: string; right: string; pct: number; color: string };
}) {
  const positive = trend == null ? null : good === "up" ? trend >= 0 : trend <= 0;
  return (
    <div className="card flex flex-col gap-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        {trend != null && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${positive ? "bg-brand-soft text-brand" : "bg-rose-soft text-rose"}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
        {pill && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{pill}</span>}
      </div>
      <p className={`text-[32px] font-bold leading-10 tracking-tight ${accent ?? ""}`}>{value}</p>
      <p className="text-xs text-muted">{sub}</p>
      {bar && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-muted"><span>{bar.label}</span><span>{bar.right}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuenow={Math.round(bar.pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.min(Math.max(bar.pct, 0), 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
