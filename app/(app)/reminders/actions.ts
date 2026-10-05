"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { installmentDue, KIND_META, nextMonthly, nextOccurrence, todayPH, type ReminderKind } from "@/lib/reminders";

export type ReminderState = { error?: string; saved?: boolean };
export type CardState = { error?: string; saved?: boolean; cardId?: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: string) => ISO.test(s) && !Number.isNaN(Date.parse(s));
const MAX_AMOUNT = 999_999_999;

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function saveCard(_: CardState, form: FormData): Promise<CardState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const due_day = Number(form.get("due_day"));
  if (!name) return { error: "Give the card a name." };
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) return { error: "Due day must be between 1 and 31." };

  const { supabase, user } = await authed();
  const { data, error } = await supabase.from("credit_cards").insert({ user_id: user.id, name, due_day }).select("id").single();
  if (error || !data) return { error: "Couldn't save the card. Please try again." };

  revalidatePath("/", "layout");
  return { saved: true, cardId: data.id };
}

export async function deleteCard(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await authed();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete the card." };
  revalidatePath("/", "layout");
  return {};
}

export async function saveReminder(_: ReminderState, form: FormData): Promise<ReminderState> {
  const kindRaw = String(form.get("kind") ?? "");
  if (kindRaw !== "installment" && kindRaw !== "card" && kindRaw !== "subscription") return { error: "Choose what you're adding." };
  const kind: ReminderKind = kindRaw;

  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const amount = Math.round(Number(form.get("amount")) * 100) / 100;
  if (!title) return { error: kind === "card" ? "What did you buy?" : "Give it a name." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return { error: "Enter an amount greater than zero." };

  const { supabase, user } = await authed();
  const today = todayPH();
  let row: Record<string, unknown>;

  if (kind === "installment") {
    const start = String(form.get("start_date") ?? "");
    const total = Number(form.get("installments_total"));
    const paid = Number(String(form.get("installments_paid") ?? "").trim() || 0);
    if (!validDate(start)) return { error: "Pick the date the installment started." };
    if (!Number.isInteger(total) || total < 1 || total > 600) return { error: "Duration must be a whole number of months, 1 or more." };
    if (!Number.isInteger(paid) || paid < 0 || paid > total) return { error: "Months paid can't be more than the duration." };
    const due_day = Number(start.slice(8, 10));
    row = {
      recurrence: "monthly",
      start_date: start,
      due_day,
      // The first bill lands a month after the start date, then one month later for each payment already made.
      due_date: installmentDue(start, paid),
      installments_total: total,
      installments_paid: paid,
      status: paid >= total ? "completed" : "active",
    };
  } else if (kind === "card") {
    const cardId = String(form.get("card_id") ?? "");
    const { data: card } = await supabase.from("credit_cards").select("id, due_day").eq("id", cardId).eq("user_id", user.id).maybeSingle();
    if (!card) return { error: "Pick which credit card this is on." };
    row = {
      recurrence: "once",
      card_id: card.id,
      due_day: card.due_day,
      due_date: nextOccurrence(today, card.due_day),
      status: "active",
    };
  } else {
    const due = String(form.get("due_date") ?? "");
    if (!validDate(due)) return { error: "Pick the next billing date." };
    row = {
      recurrence: "monthly",
      due_day: Number(due.slice(8, 10)),
      due_date: due,
      status: form.get("status") === "paused" ? "paused" : "active",
    };
  }

  const { error } = await supabase.from("reminders").insert({ user_id: user.id, kind, title, amount, ...row });
  if (error) return { error: "Couldn't save that. Please try again." };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function markReminderPaid(id: string, log: boolean): Promise<{ error?: string }> {
  const { supabase, user } = await authed();

  const { data: r } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!r) return { error: "That item is no longer active." };

  const paid = r.installments_paid + 1;

  if (log) {
    let detail = "Monthly subscription";
    if (r.kind === "installment") detail = r.installments_total ? `Installment ${paid} of ${r.installments_total}` : "Installment payment";
    if (r.kind === "card") {
      const { data: card } = r.card_id ? await supabase.from("credit_cards").select("name").eq("id", r.card_id).maybeSingle() : { data: null };
      detail = card ? `Credit card item · ${card.name}` : "Credit card item";
    }
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: r.amount,
      category: KIND_META[r.kind as ReminderKind].category,
      description: r.title,
      occurred_on: todayPH(),
      source: "manual",
      origin: "payment",
      detail,
      reminder_id: r.id,
    });
    if (error) return { error: "Couldn't log the payment." };
  }

  const finished = r.installments_total !== null && paid >= r.installments_total;
  let error;
  if (r.recurrence === "once") {
    ({ error } = await supabase.from("reminders").delete().eq("id", id).eq("user_id", user.id));
  } else {
    ({ error } = await supabase
      .from("reminders")
      .update({ installments_paid: paid, ...(finished ? { status: "completed" } : { due_date: r.start_date ? installmentDue(r.start_date, paid) : nextMonthly(r.due_date, r.due_day) }) })
      .eq("id", id)
      .eq("user_id", user.id));
  }
  if (error) return { error: "Couldn't update that item." };

  revalidatePath("/", "layout");
  return {};
}

/** Settles every open item on a card at once. */
export async function markCardPaid(cardId: string, log: boolean): Promise<{ error?: string }> {
  const { supabase, user } = await authed();

  const { data: card } = await supabase.from("credit_cards").select("name").eq("id", cardId).eq("user_id", user.id).maybeSingle();
  const { data: items } = await supabase.from("reminders").select("amount").eq("card_id", cardId).eq("user_id", user.id).eq("status", "active");
  if (!card || !items?.length) return { error: "Nothing left to pay on that card." };

  if (log) {
    const total = Math.round(items.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100;
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: total,
      category: KIND_META.card.category,
      description: `${card.name} payment`,
      occurred_on: todayPH(),
      source: "manual",
      origin: "payment",
      detail: `Credit card payment · ${items.length} item${items.length === 1 ? "" : "s"}`,
    });
    if (error) return { error: "Couldn't log the payment." };
  }

  const { error } = await supabase.from("reminders").delete().eq("card_id", cardId).eq("user_id", user.id).eq("status", "active");
  if (error) return { error: "Couldn't update the card items." };

  revalidatePath("/", "layout");
  return {};
}

export async function setSubscriptionStatus(id: string, status: "active" | "paused"): Promise<{ error?: string }> {
  const { supabase, user } = await authed();
  const { data: r } = await supabase.from("reminders").select("due_date, due_day").eq("id", id).eq("user_id", user.id).eq("kind", "subscription").maybeSingle();
  if (!r) return { error: "That subscription no longer exists." };

  // A resumed subscription shouldn't come back already overdue for the months it was paused.
  const today = todayPH();
  let due = r.due_date as string;
  if (status === "active") while (due < today) due = nextMonthly(due, r.due_day);

  const { error } = await supabase.from("reminders").update({ status, due_date: due }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't update the subscription." };
  revalidatePath("/", "layout");
  return {};
}

export async function deleteReminder(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await authed();
  const { error } = await supabase.from("reminders").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete that item." };
  revalidatePath("/", "layout");
  return {};
}
