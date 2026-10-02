export type TxType = "income" | "expense" | "savings";
export type Category = "groceries" | "utilities" | "debts" | "leisure" | "salary" | "savings" | "other";

export const EXPENSE_CATEGORIES: Category[] = ["groceries", "utilities", "debts", "leisure", "other"];
export const INCOME_CATEGORIES: Category[] = ["salary", "other"];
export const SAVINGS_CATEGORIES: Category[] = ["savings"];

export function categoriesFor(type: TxType): Category[] {
  return type === "income" ? INCOME_CATEGORIES : type === "savings" ? SAVINGS_CATEGORIES : EXPENSE_CATEGORIES;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; chip: string; tile: string }
> = {
  groceries: {
    label: "Groceries",
    color: "#0f766e",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    tile: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  utilities: {
    label: "Utilities",
    color: "#0284c7",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    tile: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  },
  debts: {
    label: "Debts",
    color: "#e11d48",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300",
    tile: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  },
  leisure: {
    label: "Leisure / Wants",
    color: "#9333ea",
    chip: "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300",
    tile: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  },
  salary: {
    label: "Salary",
    color: "#10b981",
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    tile: "bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
  },
  savings: {
    label: "Savings",
    color: "#0284c7",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300",
    tile: "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
  },
  other: {
    label: "Other",
    color: "#64748b",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    tile: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  },
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category: Category;
  description: string;
  occurred_on: string;
  source: "manual" | "voice";
  created_at: string;
};

export type TxInput = {
  id?: string;
  type: TxType;
  amount: number;
  category: Category;
  description: string;
  occurred_on: string;
  source: "manual" | "voice";
};

export type Profile = {
  id: string;
  display_name: string;
  currency: string;
  monthly_budget: number;
  savings_goal: number;
  starting_balance: number;
};

export const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"];

export function isCategoryValid(type: TxType, category: string): category is Category {
  return categoriesFor(type).includes(category as Category);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Validates and normalizes untrusted input (voice parse output, form data). Returns an error string on failure. */
export function validateTx(raw: Partial<TxInput>): { ok: true; value: TxInput } | { ok: false; error: string } {
  const type = raw.type;
  if (type !== "income" && type !== "expense" && type !== "savings") return { ok: false, error: "Choose income, expense or savings." };
  const amount = Math.round(Number(raw.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }
  if (!raw.category || !isCategoryValid(type, raw.category)) {
    return { ok: false, error: "Pick a valid category." };
  }
  const date = raw.occurred_on ?? "";
  if (!ISO.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "Enter a valid date." };
  return {
    ok: true,
    value: {
      id: raw.id,
      type,
      amount,
      category: raw.category,
      description: String(raw.description ?? "").trim().slice(0, 120),
      occurred_on: date,
      source: raw.source === "voice" ? "voice" : "manual",
    },
  };
}

