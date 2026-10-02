"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nextMonthly, todayPH } from "@/lib/reminders";

export type ReminderState = { error?: string; saved?: boolean };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function saveReminder(_: ReminderState, form: FormData): Promise<ReminderState> {
  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const amount = Math.round(Number(form.get("amount")) * 100) / 100;
  const due_date = String(form.get("due_date") ?? "");
  const recurrence = form.get("recurrence") === "once" ? "once" : "monthly";
  const totalRaw = String(form.get("installments_total") ?? "").trim();
  const paidRaw = String(form.get("installments_paid") ?? "").trim();
  const installments_total = totalRaw ? Number(totalRaw) : null;
  const installments_paid = paidRaw ? Number(paidRaw) : 0;

  if (!title) return { error: "Give the reminder a name." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!ISO.test(due_date) || Number.isNaN(Date.parse(due_date))) return { error: "Pick a valid due date." };
  if (installments_total !== null && (!Number.isInteger(installments_total) || installments_total < 1 || installments_total > 600)) {
    return { error: "Total installments must be a whole number of 1 or more." };
  }
  if (!Number.isInteger(installments_paid) || installments_paid < 0 || (installments_total !== null && installments_paid >= installments_total)) {
    return { error: "Payments already made must be fewer than the total installments." };
  }

  const { supabase, user } = await authed();
  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    title,
    amount,
    due_date,
    due_day: Number(due_date.slice(8, 10)),
    recurrence,
    installments_total: recurrence === "monthly" ? installments_total : null,
    installments_paid: recurrence === "monthly" ? installments_paid : 0,
  });
  if (error) return { error: "Couldn't save the reminder. Please try again." };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function markReminderPaid(id: string, log: boolean): Promise<{ error?: string }> {
  const { supabase, user } = await authed();

  const { data: r } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!r) return { error: "That reminder no longer exists." };

  if (log) {
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: r.amount,
      category: "debts",
      description: r.title,
      occurred_on: todayPH(),
      source: "manual",
    });
    if (error) return { error: "Couldn't log the payment." };
  }

  const paid = r.installments_paid + 1;
  const finished = r.recurrence === "once" || (r.installments_total !== null && paid >= r.installments_total);
  const { error } = finished
    ? await supabase.from("reminders").delete().eq("id", id).eq("user_id", user.id)
    : await supabase
        .from("reminders")
        .update({ due_date: nextMonthly(r.due_date, r.due_day), installments_paid: paid })
        .eq("id", id)
        .eq("user_id", user.id);
  if (error) return { error: "Couldn't update the reminder." };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteReminder(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await authed();
  const { error } = await supabase.from("reminders").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete the reminder." };
  revalidatePath("/", "layout");
  return {};
}