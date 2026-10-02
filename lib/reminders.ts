export type Reminder = {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  due_day: number;
  recurrence: "once" | "monthly";
  installments_total: number | null;
  installments_paid: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date in the Philippines (YYYY-MM-DD), independent of the server's timezone. */
export function todayPH() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDaysISO(iso: string, days: number) {
  const d = new Date(toUTC(iso) + days * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function daysUntil(due: string, today: string) {
  return Math.round((toUTC(due) - toUTC(today)) / 86_400_000);
}

/** Next monthly due date, keeping the original day (clamped for short months). */
export function nextMonthly(due: string, dueDay: number) {
  const [y, m] = due.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(dueDay, last))}`;
}

export function dueLabel(days: number) {
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function urgency(days: number): "overdue" | "soon" | "later" {
  return days < 0 ? "overdue" : days <= 7 ? "soon" : "later";
}