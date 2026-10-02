export function money(n: number, currency = "PHP", opts: { sign?: boolean; compact?: boolean } = {}) {
  const abs = Math.abs(n);
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: opts.compact && abs >= 1000 ? 0 : 2,
    maximumFractionDigits: opts.compact && abs >= 1000 ? 0 : 2,
    notation: opts.compact && abs >= 10000 ? "compact" : "standard",
  }).format(abs);
  if (n < 0) return `-${s}`;
  return opts.sign && n > 0 ? `+${s}` : s;
}

export function currencySymbol(currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM" key for the requested month, falling back to the current month. */
export function parseMonth(m?: string) {
  const match = m && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(m);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) : now.getMonth() + 1;
  return { year, month, key: `${year}-${pad(month)}` };
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1, key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` };
}

export const firstOfMonth = (year: number, month: number) => `${year}-${pad(month)}-01`;

export function monthLabel(year: number, month: number, style: "long" | "short" = "long") {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: style, year: "numeric" });
}

/** Formats a YYYY-MM-DD string without timezone shifts. */
export function dateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
