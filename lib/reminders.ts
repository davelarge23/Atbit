import type { Category } from "@/lib/types";

export type ReminderKind = "installment" | "card" | "subscription";
export type ReminderStatus = "active" | "paused" | "completed";

export type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  amount: number;
  due_date: string;
  due_day: number;
  recurrence: "once" | "monthly";
  start_date: string | null;
  card_id: string | null;
  status: ReminderStatus;
  installments_total: number | null;
  installments_paid: number;
};

export type CreditCard = { id: string; name: string; due_day: number };

/** Reminders start showing up this many days before the due date. */
export const REMIND_DAYS = 10;

export const KINDS: ReminderKind[] = ["installment", "card", "subscription"];

export const KIND_META: Record<ReminderKind, { label: string; plural: string; category: Category; chip: string }> = {
  installment: { label: "Installment", plural: "Installments", category: "debts", chip: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300" },
  card: { label: "Credit card", plural: "Credit cards", category: "debts", chip: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300" },
  subscription: { label: "Subscription", plural: "Subscriptions", category: "subscriptions", chip: "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300" },
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

/** `iso` shifted by `months`, landing on `day` (clamped for short months). */
export function addMonthsISO(iso: string, months: number, day = Number(iso.slice(8, 10))) {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(day, last))}`;
}

/** Next bill for an installment: first bill is one month after the start date, then one more per payment made. */
export function installmentDue(start: string, paid: number) {
  return addMonthsISO(start, paid + 1, Number(start.slice(8, 10)));
}

/** Next monthly due date, keeping the original day (clamped for short months). */
export function nextMonthly(due: string, dueDay: number) {
  return addMonthsISO(due, 1, dueDay);
}

/** The next date (today or later) that falls on `day` of a month. */
export function nextOccurrence(today: string, day: number) {
  const thisMonth = addMonthsISO(today, 0, day);
  return thisMonth >= today ? thisMonth : addMonthsISO(today, 1, day);
}

export function dueLabel(days: number) {
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function urgency(days: number): "overdue" | "soon" | "later" {
  return days < 0 ? "overdue" : days <= REMIND_DAYS ? "soon" : "later";
}

export function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}
