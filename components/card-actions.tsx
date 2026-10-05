"use client";

import { useState, useTransition } from "react";
import { deleteCard, markCardPaid } from "@/app/(app)/reminders/actions";
import { useFeedback } from "@/components/feedback";
import { BusyLabel } from "@/components/spinner";

export function CardActions({ id, name, canPay }: { id: string; name: string; canPay: boolean }) {
  const { toast, confirm } = useFeedback();
  const [busy, start] = useTransition();
  const [which, setWhich] = useState<"log" | "paid" | "delete" | null>(null);
  const running = (k: typeof which) => busy && which === k;

  async function pay(log: boolean) {
    const ok = await confirm({
      title: log ? "Pay the whole card and log it?" : "Mark the whole card as paid?",
      message: `Every open item on ${name} will be cleared${log ? " and recorded as one Debts expense" : " without logging an expense"}.`,
      confirmLabel: "Mark paid",
    });
    if (!ok) return;
    setWhich(log ? "log" : "paid");
    start(async () => {
      const res = await markCardPaid(id, log);
      toast(res.error ?? (log ? "Card payment logged." : "Card cleared."), res.error ? "error" : "success");
    });
  }

  async function remove() {
    const ok = await confirm({ title: `Delete ${name}?`, message: "The card and all of its items will be removed. This can't be undone.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    setWhich("delete");
    start(async () => {
      const res = await deleteCard(id);
      toast(res.error ?? "Card deleted.", res.error ? "error" : "success");
    });
  }

  const btn = "btn-secondary !px-3 !py-1.5 !text-xs";
  return (
    <div className="flex items-center gap-1.5">
      {canPay && <button onClick={() => pay(true)} disabled={busy} className={btn}><BusyLabel busy={running("log")} label="Pay all + log" busyLabel="Logging?" /></button>}
      {canPay && <button onClick={() => pay(false)} disabled={busy} className={btn}><BusyLabel busy={running("paid")} label="Pay all" busyLabel="Saving?" /></button>}
      <button onClick={remove} disabled={busy} className={`${btn} text-rose`}><BusyLabel busy={running("delete")} label="Delete card" busyLabel="Deleting?" /></button>
    </div>
  );
}
