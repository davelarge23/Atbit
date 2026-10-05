"use client";

import { useActionState, useState } from "react";
import { Logo } from "@/components/logo";
import { BusyLabel } from "@/components/spinner";
import { authenticate, type AuthState } from "./actions";

export default function LoginForm({ confirmError }: { confirmError: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {
    error: confirmError ? "That confirmation link is invalid or expired." : undefined,
  });

  return (
    <div className="card w-full max-w-sm p-8 shadow-float">
      <Logo />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {mode === "login" ? "Welcome back" : "Create your vault"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "login" ? "Sign in to see your financial flow." : "Start tracking your budget by voice."}
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />
        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input name="name" className="field" autoComplete="name" />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            className="field"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {state.error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{state.error}</p>}
        {state.notice && <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{state.notice}</p>}
        <button className="btn-primary" disabled={pending}>
          <BusyLabel busy={pending} busyLabel={mode === "login" ? "Signing in…" : "Creating account…"} label={mode === "login" ? "Sign in" : "Create account"} />
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-5 w-full text-center text-sm text-muted hover:text-ink"
      >
        {mode === "login" ? "New to Atbit? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
