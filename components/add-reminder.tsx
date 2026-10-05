"use client";

import { startTransition, useActionState, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { saveCard, saveReminder, type CardState, type ReminderState } from "@/app/(app)/reminders/actions";
import { useFeedback } from "@/components/feedback";
import { Modal } from "@/components/modal";
import { BusyLabel } from "@/components/spinner";
import { currencySymbol, dateLabel } from "@/lib/format";
import { installmentDue, KIND_META, KINDS, ordinal, type CreditCard, type ReminderKind } from "@/lib/reminders";

const NEW_CARD = "__new";

// Dispatch manually so a failed submit keeps what the user typed (React resets <form action> fields).
function submit(e: React.FormEvent<HTMLFormElement>, action: (fd: FormData) => void) {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  startTransition(() => action(data));
}

export function AddReminder({ currency, today, cards }: { currency: string; today: string; cards: CreditCard[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} className="mr-1.5" />Add item</button>
      {open && <AddDialog currency={currency} today={today} cards={cards} onClose={close} />}
    </>
  );
}

function AddDialog({ currency, today, cards, onClose }: { currency: string; today: string; cards: CreditCard[]; onClose: () => void }) {
  const [state, action, pending] = useActionState<ReminderState, FormData>(saveReminder, {});
  const [kind, setKind] = useState<ReminderKind>("installment");
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [start, setStart] = useState(today);
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");
  const paidN = Number(paid || 0);
  const totalN = Number(total);
  const preview =
    /^\d{4}-\d{2}-\d{2}$/.test(start) && Number.isInteger(paidN) && paidN >= 0 && Number.isInteger(totalN) && totalN > 0
      ? paidN >= totalN ? "Fully paid" : dateLabel(installmentDue(start, paidN))
      : null;
  const [cardPopup, setCardPopup] = useState(false);
  const closeCardPopup = useCallback(() => setCardPopup(false), []);
  const { toast } = useFeedback();

  useEffect(() => {
    if (state.saved) {
      toast("Added.");
      onClose();
    } else if (state.error) toast(state.error, "error");
  }, [state, toast, onClose]);

  // A card item needs a card first, so ask for one up front.
  function pickKind(k: ReminderKind) {
    setKind(k);
    if (k === "card" && cards.length === 0) setCardPopup(true);
  }

  return (
    <>
      <Modal title="Add item" subtitle="Reminders start 10 days before each due date." onClose={onClose}>
        <form onSubmit={(e) => submit(e, action)} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-track p-1" role="radiogroup" aria-label="Type">
            {KINDS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => pickKind(k)}
                className={`rounded-md py-1.5 text-sm font-semibold transition ${kind === k ? "bg-card shadow-card" : "text-muted"}`}>
                {KIND_META[k].label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">{kind === "card" ? "Item" : "Name"}
            <input name="title" required maxLength={80} autoFocus className="field"
              placeholder={kind === "installment" ? "e.g. Phone installment" : kind === "card" ? "e.g. Air fryer" : "e.g. Netflix"} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">{kind === "installment" ? "Monthly amount" : kind === "card" ? "Price" : "Amount per month"}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{currencySymbol(currency)}</span>
              <input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="field pl-8" />
            </div>
          </label>

          {kind === "installment" && (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium">Date started
                <input name="start_date" type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="field" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium">Duration (months)
                  <input name="installments_total" type="number" min="1" max="600" step="1" required value={total} onChange={(e) => setTotal(e.target.value)} className="field" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">Months paid
                  <input name="installments_paid" type="number" min="0" step="1" placeholder="0" value={paid} onChange={(e) => setPaid(e.target.value)} className="field" />
                </label>
              </div>
              <p className="rounded-lg bg-track px-3 py-2 text-xs text-muted">
                {preview ? <>Next billing: <span className="font-semibold text-ink">{preview}</span></> : "Next billing date appears once you fill this in."}
              </p>
            </>
          )}

          {kind === "card" && (
            <label className="flex flex-col gap-1 text-sm font-medium">Credit card
              <select name="card_id" required value={cardId} className="field"
                onChange={(e) => (e.target.value === NEW_CARD ? setCardPopup(true) : setCardId(e.target.value))}>
                {cards.length === 0 && <option value="">No cards yet</option>}
                {cards.map((c) => <option key={c.id} value={c.id}>{c.name} · due every {ordinal(c.due_day)}</option>)}
                <option value={NEW_CARD}>+ Add a new card…</option>
              </select>
            </label>
          )}

          {kind === "subscription" && (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium">Next billing date
                <input name="due_date" type="date" required defaultValue={today} className="field" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">Status
                <select name="status" defaultValue="active" className="field">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </label>
            </>
          )}

          {state.error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={pending || (kind === "card" && !cardId)}><BusyLabel busy={pending} label={`Add ${KIND_META[kind].label.toLowerCase()}`} /></button>
          </div>
        </form>
      </Modal>
      {cardPopup && <CardDialog onClose={closeCardPopup} onCreated={setCardId} />}
    </>
  );
}

export function CardDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [state, action, pending] = useActionState<CardState, FormData>(saveCard, {});
  const { toast } = useFeedback();

  useEffect(() => {
    if (state.saved && state.cardId) {
      onCreated(state.cardId);
      toast("Card added.");
      onClose();
    } else if (state.error) toast(state.error, "error");
  }, [state, toast, onCreated, onClose]);

  return (
    <Modal title="Add a credit card" subtitle="Items you add to it will be due on its due date." onClose={onClose} layer={70}>
      <form onSubmit={(e) => submit(e, action)} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">Card name
          <input name="name" required maxLength={40} autoFocus placeholder="e.g. BDO Visa" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Due day of the month
          <input name="due_day" type="number" min="1" max="31" step="1" required placeholder="e.g. 15" className="field" />
        </label>
        {state.error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={pending}><BusyLabel busy={pending} label="Save card" /></button>
        </div>
      </form>
    </Modal>
  );
}
