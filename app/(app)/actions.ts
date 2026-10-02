"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES, validateTx, type TxInput } from "@/lib/types";

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