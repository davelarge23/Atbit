"use client";

import { useActionState, useEffect } from "react";
import { useFeedback } from "@/components/feedback";
import { BusyLabel } from "@/components/spinner";
import { saveSettings, type SettingsState } from "@/app/(app)/actions";
import { CURRENCIES, type Profile } from "@/lib/types";

export function SettingsForm({ profile, email, dark, large, motion }: { profile: Profile; email: string; dark: boolean; large: boolean; motion: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  const { toast } = useFeedback();
  useEffect(() => {
    if (state.saved) toast("Settings saved.");
    else if (state.error) toast(state.error, "error");
  }, [state, toast]);
  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="card flex flex-col gap-4 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">Email<input className="field opacity-60" value={email} disabled readOnly /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Display name<input name="display_name" required maxLength={60} defaultValue={profile.display_name} className="field" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">Currency
            <select name="currency" defaultValue={profile.currency} className="field">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Starting balance
            <input name="starting_balance" type="number" step="0.01" defaultValue={profile.starting_balance} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Monthly budget ceiling
            <input name="monthly_budget" type="number" step="0.01" min="0" defaultValue={profile.monthly_budget} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Monthly savings goal
            <input name="savings_goal" type="number" step="0.01" min="0" defaultValue={profile.savings_goal} className="field" />
          </label>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Accessibility &amp; appearance</h2>
        <Toggle name="dark" label="Dark mode" hint="Easier on the eyes at night." checked={dark} />
        <Toggle name="large" label="Larger text" hint="Scales the interface up by about 12%." checked={large} />
        <Toggle name="reduce_motion" label="Reduce motion" hint="Turns off animations and transitions." checked={motion} />
      </section>

      {state.error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{state.error}</p>}
      <button className="btn-primary self-start" disabled={pending}><BusyLabel busy={pending} label="Save changes" /></button>
    </form>
  );
}

function Toggle({ name, label, hint, checked }: { name: string; label: string; hint: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span><span className="block text-sm font-semibold">{label}</span><span className="text-xs text-muted">{hint}</span></span>
      <input type="checkbox" name={name} defaultChecked={checked} className="h-5 w-5 rounded" />
    </label>
  );
}
