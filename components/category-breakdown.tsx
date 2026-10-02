"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_META, type Category } from "@/lib/types";
import { money, pct } from "@/lib/format";

export function CategoryBreakdown({ items, total, currency }: { items: { category: Category; amount: number }[]; total: number; currency: string }) {
  if (total === 0) return <p className="py-10 text-center text-sm text-muted">No expenses logged this month yet.</p>;
  return (
    <div>
      <div className="h-44" role="img" aria-label="Expense categories donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="amount" nameKey="category" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
              {items.map((i) => <Cell key={i.category} fill={CATEGORY_META[i.category].color} />)}
            </Pie>
            <Tooltip formatter={(v) => money(Number(v), currency)} labelFormatter={() => ""} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.category} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: CATEGORY_META[i.category].color }} />
            <span className="flex-1 text-sm font-semibold">{CATEGORY_META[i.category].label}</span>
            <span className="text-sm font-bold">{money(i.amount, currency)}</span>
            <span className={`w-14 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${CATEGORY_META[i.category].chip}`}>{pct((i.amount / total) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
