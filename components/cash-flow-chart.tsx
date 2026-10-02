"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

type Point = { type: "income" | "expense" | "savings"; amount: number; occurred_on: string };
type Range = "weekly" | "monthly" | "quarterly" | "ytd";
const RANGES: { id: Range; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "ytd", label: "YTD" },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CashFlowChart({ data, year, month, currency }: { data: Point[]; year: number; month: number; currency: string }) {
  const [range, setRange] = useState<Range>("weekly");

  const rows = useMemo(() => {
    const buckets =
      range === "weekly"
        ? ["W1", "W2", "W3", "W4"].map((name) => ({ name, income: 0, expenses: 0, saved: 0 }))
        : range === "quarterly"
          ? ["Q1", "Q2", "Q3", "Q4"].map((name) => ({ name, income: 0, expenses: 0, saved: 0 }))
          : (range === "ytd" ? MONTHS.slice(0, month) : MONTHS).map((name) => ({ name, income: 0, expenses: 0, saved: 0 }));

    for (const t of data) {
      const [y, m, d] = t.occurred_on.split("-").map(Number);
      if (y !== year) continue;
      let idx: number;
      if (range === "weekly") {
        if (m !== month) continue;
        idx = Math.min(Math.floor((d - 1) / 7), 3);
      } else if (range === "quarterly") idx = Math.floor((m - 1) / 3);
      else if (range === "ytd") {
        if (m > month) continue;
        idx = m - 1;
      } else idx = m - 1;
      buckets[idx][t.type === "income" ? "income" : t.type === "savings" ? "saved" : "expenses"] += t.amount;
    }
    return buckets;
  }, [data, range, year, month]);

  const tooltipFmt = (v: unknown) => money(Number(v), currency);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-xs font-medium text-muted">
          <Legend color="#0f766e" label="Income" />
          <Legend color="#e11d48" label="Expenses" />
          <Legend color="#0284c7" label="Saved" />
        </div>
        <div className="flex gap-0.5 rounded-lg bg-track p-1" role="tablist" aria-label="Cash flow range">
          {RANGES.map((r) => (
            <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${range === r.id ? "bg-card shadow-card" : "text-muted"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64" role="img" aria-label="Bar chart of income, expenses and savings">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(v) => money(Number(v), currency, { compact: true }).replace(/\.00$/, "")} />
            <Tooltip formatter={tooltipFmt} cursor={{ fill: "var(--track)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" }} />
            <Bar dataKey="income" name="Income" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#e11d48" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saved" name="Saved" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
