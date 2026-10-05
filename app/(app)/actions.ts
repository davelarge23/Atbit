"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { installmentDue, nextOccurrence, todayPH } from "@/lib/reminders";
import { CURRENCIES, validateTx, type Category, type TxInput } from "@/lib/types";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: string) => ISO.test(s) && !Number.isNaN(Date.parse(s));
const cents = (n: number) => Math.round(n * 100) / 100;

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function saveTransaction(input: Partial<TxInput>): Promise<{ error?: string; id?: string }> {
  const parsed = validateTx(input);
  if (!parsed.ok) return { error: parsed.error };
  const { supabase, user } = await authed();
  const { id, ...fields } = parsed.value;

  const { data, error } = id
    ? await supabase.from("transactions").update(fields).eq("id", id).eq("user_id", user.id).select("id").maybeSingle()
    : await supabase.from("transactions").insert({ ...fields, user_id: user.id }).select("id").single();
  if (error || !data) return { error: "Couldn't save the transaction. Please try again." };

  revalidatePath("/", "layout");
  return { id: data.id as string };
}

export type LoanInput = { name: string; amount: number; repayment: number; start_date: string; months: number };

/** Income from a loan: adds the cash received and creates the repayment installment. */
export async function saveLoanIncome(input: LoanInput): Promise<{ error?: string; id?: string }> {
  const name = String(input.name ?? "").trim().slice(0, 80);
  const amount = cents(Number(input.amount));
  const repayment = cents(Number(input.repayment));
  const months = Number(input.months);
  if (!name) return { error: "Give the loan a name." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999) return { error: "Enter the loan amount you received." };
  if (!Number.isFinite(repayment) || repayment <= 0 || repayment > 999_999_999) return { error: "Enter the repayment amount per month." };
  if (!Number.isInteger(months) || months < 1 || months > 600) return { error: "Installment plan must be a whole number of months, 1 or more." };
  if (!validDate(String(input.start_date))) return { error: "Pick the date the loan started." };
  const start = input.start_date;

  const { supabase, user } = await authed();
  const due_day = Number(start.slice(8, 10));
  const { data: reminder, error: rErr } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      kind: "installment",
      title: name,
      amount: repayment,
      recurrence: "monthly",
      start_date: start,
      due_day,
      due_date: installmentDue(start, 0),
      installments_total: months,
      installments_paid: 0,
      status: "active",
    })
    .select("id")
    .single();
  if (rErr || !reminder) return { error: "Couldn't create the installment. Please try again." };

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "income",
      amount,
      category: "other",
      description: name,
      occurred_on: start,
      source: "manual",
      funds_source: "loan",
      origin: "loan",
      detail: `Loan · ${months} monthly payments`,
      reminder_id: reminder.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    await supabase.from("reminders").delete().eq("id", reminder.id).eq("user_id", user.id);
    return { error: "Couldn't log the loan. Please try again." };
  }

  revalidatePath("/", "layout");
  return { id: data.id as string };
}

export type CardExpenseInput = { amount: number; description: string; category: Category; occurred_on: string; card_id: string };

/** Expense charged to a card: logged for history, tracked as an open item on that card, no cash deducted. */
export async function saveCardExpense(input: CardExpenseInput): Promise<{ error?: string; id?: string }> {
  const parsed = validateTx({ type: "expense", amount: input.amount, category: input.category, description: input.description, occurred_on: input.occurred_on });
  if (!parsed.ok) return { error: parsed.error };
  const { amount, category, description, occurred_on } = parsed.value;
  if (!description) return { error: "Enter what you bought so it can be tracked on the card." };

  const { supabase, user } = await authed();
  const { data: card } = await supabase.from("credit_cards").select("id, name, due_day").eq("id", input.card_id).eq("user_id", user.id).maybeSingle();
  if (!card) return { error: "Pick which credit card this was charged to." };

  const { data: reminder, error: rErr } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      kind: "card",
      title: description.slice(0, 80),
      amount,
      recurrence: "once",
      card_id: card.id,
      due_day: card.due_day,
      due_date: nextOccurrence(todayPH(), card.due_day),
      status: "active",
    })
    .select("id")
    .single();
  if (rErr || !reminder) return { error: "Couldn't add it to the card. Please try again." };

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "expense",
      amount,
      category,
      description,
      occurred_on,
      source: "manual",
      funds_source: "card",
      origin: "card",
      detail: `Charged to ${card.name}`,
      reminder_id: reminder.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    await supabase.from("reminders").delete().eq("id", reminder.id).eq("user_id", user.id);
    return { error: "Couldn't log the expense. Please try again." };
  }

  revalidatePath("/", "layout");
  return { id: data.id as string };
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await authed();
  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete the transaction." };
  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type SettingsState = { error?: string; saved?: boolean };

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const { supabase, user } = await authed();
  const num = (k: string) => Number(form.get(k) || 0);
  const currency = String(form.get("currency"));
  const display_name = String(form.get("display_name") ?? "").trim().slice(0, 60);
  const monthly_budget = num("monthly_budget");
  const savings_goal = num("savings_goal");
  const starting_balance = num("starting_balance");

  if (!CURRENCIES.includes(currency)) return { error: "Unsupported currency." };
  if (!display_name) return { error: "Name can't be empty." };
  if (![monthly_budget, savings_goal, starting_balance].every(Number.isFinite) || monthly_budget < 0 || savings_goal < 0) {
    return { error: "Budget and goal must be zero or more." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name, currency, monthly_budget, savings_goal, starting_balance });
  if (error) return { error: "Couldn't save settings." };

  const jar = await cookies();
  const opts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  jar.set("pref_dark", form.get("dark") ? "1" : "0", opts);
  jar.set("pref_large", form.get("large") ? "1" : "0", opts);
  jar.set("pref_motion", form.get("reduce_motion") ? "1" : "0", opts);

  revalidatePath("/", "layout");
  return { saved: true };
}