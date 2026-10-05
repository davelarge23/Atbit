"use client";

import { useState, useTransition } from "react";
import { deleteReminder, markReminderPaid, setSubscriptionStatus } from "@/app/(app)/reminders/actions";
import { useFeedback } from "@/components/feedback";
import { BusyLabel } from "@/components/spinner";
import { CATEGORY_META } from "@/lib/types";
import { KIND_META, type Reminder } from "@/lib/reminders";

export function ReminderActions({ r }: { r: Reminder }) {
  const { toast, confirm } = useFeedback();
  const [busy, start] = useTransition();
  const [which, setWhich] = useState<"log" | "paid" | "toggle" | "delete" | null>(null);
  const running = (k: typeof which) => busy && which === k;
  const category = CATEGORY_META[KIND_META[r.kind].category].label;
  const active = r.status === "active";

  // confirm() must run outside the transition, otherwise its dialog never renders.
  async function pay(log: boolean) {
    const ok = await confirm({
      title: log ? "Mark as paid and log it?" : "Mark as paid?",
      message: log
        ? `"${r.title}" will be recorded as a ${category} expense and ${r.recurrence === "once" ? "removed" : "moved to its next due date"}.`
        : `"${r.title}" will be ${r.recurrence === "once" ? "removed" : "moved to its next due date"} without logging an expense.`,
      confirmLabel: "Mark paid",
    });
    if (!ok) return;
    setWhich(log ? "log" : "paid");
    start(async () => {
      const res = await markReminderPaid(r.id, log);
      toast(res.error ?? (log ? "Payment logged and updated." : "Updated."), res.error ? "error" : "success");
    });
  }

  function toggle() {
    setWhich("toggle");
    start(async () => {
      const res = await setSubscriptionStatus(r.id, active ? "paused" : "active");
      toast(res.error ?? (active ? "Subscription paused." : "Subscription resumed."), res.error ? "error" : "success");
    });
  }

  async function remove() {
    const ok = await confirm({ title: "Delete this item?", message: `"${r.title}" will be removed along with its progress. This can't be undone.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    setWhich("delete");
    start(async () => {
      const res = await deleteReminder(r.id);
      toast(res.error ?? "Deleted.", res.error ? "error" : "success");
    });
  }

  const btn = "btn-secondary !px-3 !py-1.5 !text-xs";
  return (
    <div className="flex items-center gap-1.5">
      {active && <button onClick={() => pay(true)} disabled={busy} className={btn} title={`Mark paid and record it as a ${category} expense`}><BusyLabel busy={running("log")} label="Paid + log" busyLabel="Logging?" /></button>}
      {active && <button onClick={() => pay(false)} disabled={busy} className={btn} title="Mark paid without logging an expense"><BusyLabel busy={running("paid")} label="Paid" busyLabel="Saving?" /></button>}
      {r.kind === "subscription" && <button onClick={toggle} disabled={busy} className={btn}><BusyLabel busy={running("toggle")} label={active ? "Pause" : "Resume"} busyLabel="Updating?" /></button>}
      <button onClick={remove} disabled={busy} className={`${btn} text-rose`}><BusyLabel busy={running("delete")} label="Delete" busyLabel="Deleting?" /></button>
    </div>
  );
}
