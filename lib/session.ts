import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile: Profile = {
    id: user.id,
    display_name: data?.display_name || user.email?.split("@")[0] || "there",
    currency: data?.currency ?? "PHP",
    monthly_budget: Number(data?.monthly_budget ?? 0),
    savings_goal: Number(data?.savings_goal ?? 0),
    starting_balance: Number(data?.starting_balance ?? 0),
  };
  return { supabase, user, profile };
}
