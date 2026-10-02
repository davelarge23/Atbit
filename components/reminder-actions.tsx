"use client";

import { useTransition } from "react";
import { deleteReminder, markReminderPaid } from "@/app/(app)/reminders/actions";
import { useFeedback } from "@/components/feedback";

export function ReminderActions({ id, title, manage }: { id: string; title: string; manage: boolean }) {
  const { toast, confirm } = useFeedback();
  const [busy, start] = useTransition();

  // confirm() must run outside the transition, otherwise its dialog never renders.
  async function pay(log: boolean) {
    const ok = await confirm({
      title: log ? "Mark as paid and log it?" : "Mark as paid?",
      message: log ? `"${title}" will be recorded as a Debts expense and moved to its next due date.` : `"${title}" will move to its next due date without logging an expense.`,
      confirmLabel: "Mark paid",
    });
    if (!ok) return;
    start(async () => {
      const res = await markReminderPaid(id, log);
      toast(res.error ?? (log ? "Payment logged and reminder updated." : "Reminder updated."), res.error ? "error" : "success");
    });
  }

  async function remove() {
    const ok = await confirm({ title: "Delete this reminder?", message: `"${title}" will stop reminding you. This can't be undone.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    start(async () => {
      const res = await deleteReminder(id);
      toast(res.error ?? "Reminder deleted.", res.error ? "error" : "success");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => pay(true)} disabled={busy} className="btn-secondary !px-3 !py-1.5 !text-xs" title="Mark paid and record it as a Debts expense">Paid + log</button>
      {manage && (
        <>
          <button onClick={() => pay(false)} disabled={busy} className="btn-secondary !px-3 !py-1.5 !text-xs" title="Mark paid without logging an expense">Paid</button>
          <button onClick={remove} disabled={busy} className="btn-secondary !px-3 !py-1.5 !text-xs text-rose">Delete</button>
        </>
      )}
    </div>
  );
}