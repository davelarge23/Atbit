"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

export async function authenticate(_: AuthState, form: FormData): Promise<AuthState> {
  const mode = form.get("mode") === "signup" ? "signup" : "login";
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();

  if (mode === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Invalid email or password." };
    redirect("/");
  }

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name || email.split("@")[0] }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/");
  return { notice: "Check your inbox to confirm your email, then sign in." };
}
