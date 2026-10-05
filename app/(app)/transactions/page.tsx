import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { AddButton } from "@/components/add-button";
import { TxRow } from "@/components/tx-row";
import { money } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { addDaysISO, todayPH } from "@/lib/reminders";
import { CATEGORY_META, EXPENSE_CATEGORIES, type Category, type Transaction } from "@/lib/types";

export const metadata: Metadata = { title: "Transactions" };

const PAGE_SIZE = 15;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const from = ISO.test(get("from")) ? get("from") : "";
  const to = ISO.test(get("to")) ? get("to") : "";
  const type = ["income", "expense", "savings"].includes(get("type")) ? get("type") : "";
  const category = get("category") in CATEGORY_META ? get("category") : "";
  const q = get("q").trim().slice(0, 80);
  const sort = get("sort") === "amount" ? "amount" : "occurred_on";
  const asc = get("dir") === "asc";
  const page = Math.max(1, Number.parseInt(get("page")) || 1);

  const { supabase, profile } = await requireUser();
  const cur = profile.currency;

  const build = (cols: string) => {
    let query = supabase.from("transactions").select(cols, { count: "exact" });
    if (from) query = query.gte("occurred_on", from);
    if (to) query = query.lte("occurred_on", to);
    if (type) query = query.eq("type", type);
    if (category) query = query.eq("category", category);
    if (q) query = query.ilike("description", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    return query;
  };

  const [list, totals] = await Promise.all([
    build("*")
      .order(sort, { ascending: asc })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    build("type, amount, category, funds_source"),
  ]);

  const txs = ((list.data ?? []) as unknown as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
  const count = list.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  // Card charges aren't cash movements; they count when the card is paid.
  const all = ((totals.data ?? []) as unknown as Pick<Transaction, "type" | "amount" | "category" | "funds_source">[]).filter((t) => t.funds_source !== "card");
  const income = all.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = all.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const saved = all.filter((t) => t.type === "savings").reduce((s, t) => s + Number(t.amount), 0);

  const today = todayPH();
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = (yy: number, mm: number) => {
    const d = new Date(Date.UTC(yy, mm - 1, 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
  };
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const quick: { label: string; from: string; to: string }[] = [
    { label: "Today", from: today, to: today },
    { label: "This week", from: addDaysISO(today, -dow), to: today },
    { label: "This month", from: monthStart(y, m), to: today },
    { label: "Last month", from: monthStart(y, m - 1), to: addDaysISO(monthStart(y, m), -1) },
    { label: "Last 3 months", from: monthStart(y, m - 2), to: today },
    { label: "This year", from: `${y}-01-01`, to: today },
  ];

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ from, to, type, category, q, sort, dir: asc ? "asc" : "desc", page: String(page), ...over });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/transactions?${p}`;
  };
  const sortLink = (col: "occurred_on" | "amount", label: string) => {
    const active = sort === col;
    return (
      <Link href={href({ sort: col, dir: active && !asc ? "asc" : "desc", page: "1" })} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${active ? "bg-track" : "text-muted hover:bg-track"}`}>
        {label} {active && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted">Search, filter and edit your full ledger.</p>
        </div>
        <AddButton><Plus size={16} /> Add transaction</AddButton>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Quick date filters">
        {quick.map((r) => {
          const active = from === r.from && to === r.to;
          return (
            <Link key={r.label} href={href({ from: r.from, to: r.to, page: "1" })} aria-current={active ? "true" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${active ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:bg-track"}`}>
              {r.label}
            </Link>
          );
        })}
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" action="/transactions">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={asc ? "asc" : "desc"} />
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">From<input type="date" name="from" defaultValue={from} className="field" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">To<input type="date" name="to" defaultValue={to} className="field" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Type
          <select name="type" defaultValue={type} className="field"><option value="">All</option><option value="income">Income</option><option value="expense">Expense</option><option value="savings">Savings</option></select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Category
          <select name="category" defaultValue={category} className="field">
            <option value="">All</option>
            {([...EXPENSE_CATEGORIES, "salary", "savings"] as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Search<input name="q" defaultValue={q} placeholder="Merchant…" className="field" /></label>
        <div className="flex items-end gap-2">
          <button className="btn-primary flex-1">Apply</button>
          <Link href="/transactions" className="btn-secondary">Reset</Link>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Income</p><p className="text-2xl font-bold text-brand">{money(income, cur)}</p></div>
        <div className="card p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Expenses</p><p className="text-2xl font-bold text-rose">{money(expenses, cur)}</p></div>
        <div className="card p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Saved</p><p className="text-2xl font-bold text-sky">{money(saved, cur)}</p></div>
        <div className="card p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Net</p><p className="text-2xl font-bold">{money(income - expenses - saved, cur, { sign: true })}</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXPENSE_CATEGORIES.map((c) => {
          const amt = all.filter((t) => t.type === "expense" && t.category === c).reduce((s, t) => s + Number(t.amount), 0);
          if (!amt) return null;
          return <span key={c} className={`rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_META[c].chip}`}>{CATEGORY_META[c].label}: {money(amt, cur)}</span>;
        })}
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <span className="text-xs font-semibold text-muted">Sort by</span>
          {sortLink("occurred_on", "Date")}
          {sortLink("amount", "Amount")}
          <span className="ml-auto text-xs text-muted">{count} result{count === 1 ? "" : "s"}</span>
        </div>
        {txs.length ? (
          <ul>{txs.map((t) => <TxRow key={t.id} tx={t} currency={cur} />)}</ul>
        ) : (
          <p className="py-12 text-center text-sm text-muted">No transactions match these filters.</p>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
            {page > 1 ? <Link href={href({ page: String(page - 1) })} className="btn-secondary">Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={href({ page: String(page + 1) })} className="btn-secondary">Next</Link> : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
