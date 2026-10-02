"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveReminder, type ReminderState } from "@/app/(app)/reminders/actions";
import { useFeedback } from "@/components/feedback";
import { currencySymbol } from "@/lib/format";

export function ReminderForm({ currency, today }: { currency: string; today: string }) {
  const [state, action, pending] = useActionState<ReminderState, FormData>(saveReminder, {});
  const [recurrence, setRecurrence] = useState("monthly");
  const ref = useRef<HTMLFormElement>(null);
  const { toast } = useFeedback();

  useEffect(() => {
    if (state.saved) {
      ref.current?.reset();
      toast("Reminder added.");
    } else if (state.error) toast(state.error, "error");
  }, [state, toast]);

  return (
    <form ref={ref} action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold tracking-tight sm:col-span-2">New reminder</h2>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">Name
        <input name="title" required maxLength={80} placeholder="e.g. Phone installment, Home loan" className="field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Amount
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{currencySymbol(currency)}</span>
          <input name="amount" type="number" step="0.01" min="0.01" required className="field pl-8" />
        </div>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Next due date
        <input name="due_date" type="date" required defaultValue={today} className="field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Repeats
        <select name="recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="field">
          <option value="monthly">Monthly</option>
          <option value="once">One time</option>
        </select>
      </label>
      {recurrence === "monthly" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">Total installments
            <input name="installments_total" type="number" min="1" step="1" placeholder="Optional" className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Already paid
            <input name="installments_paid" type="number" min="0" step="1" placeholder="0" className="field" />
          </label>
        </div>
      )}
      {state.error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose sm:col-span-2">{state.error}</p>}
      <button className="btn-primary sm:col-span-2 sm:justify-self-start" disabled={pending}>{pending ? "Saving…" : "Add reminder"}</button>
    </form>
  );
}
