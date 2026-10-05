"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Square, X } from "lucide-react";
import { BusyLabel } from "@/components/spinner";
import { Waveform } from "@/components/waveform";
import { useFeedback } from "@/components/feedback";
import { saveTransaction, saveLoanIncome, saveCardExpense, deleteTransaction } from "@/app/(app)/actions";
import { CardDialog } from "@/components/add-reminder";
import { currencySymbol, dateLabel, money, todayISO } from "@/lib/format";
import { installmentDue, ordinal, type CreditCard } from "@/lib/reminders";
import {
  CATEGORY_META,
  type Category,
  type FundsSource,
  categoriesFor,
  type Transaction,
  type TxInput,
  type TxType,
} from "@/lib/types";

type Mode = "voice" | "manual";
type Ctx = { open: (mode: Mode, tx?: Transaction, text?: string) => void; voiceEnabled: boolean };

const LogContext = createContext<Ctx | null>(null);

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog must be used inside LogProvider");
  return ctx;
}

type Draft = { id?: string; type: TxType; amount: string; category: string; description: string; occurred_on: string; source: "manual" | "voice" };

const blank = (): Draft => ({ type: "expense", amount: "", category: "groceries", description: "", occurred_on: todayISO(), source: "manual" });

export type Suggestion = { type: TxType; amount: number; category: Category; description: string };

export function LogProvider({ children, voiceEnabled, currency, history, cards }: { children: React.ReactNode; voiceEnabled: boolean; currency: string; history: Suggestion[]; cards: CreditCard[] }) {
  const [state, setState] = useState<{ mode: Mode; tx?: Transaction; text?: string; nonce: number } | null>(null);
  const open = useCallback((mode: Mode, tx?: Transaction, text?: string) => setState((s) => ({ mode, tx, text, nonce: (s?.nonce ?? 0) + 1 })), []);

  return (
    <LogContext.Provider value={{ open, voiceEnabled }}>
      {children}
      {state && <LogDialog key={state.nonce} {...state} voiceEnabled={voiceEnabled} currency={currency} history={history} cards={cards} onClose={() => setState(null)} />}
    </LogContext.Provider>
  );
}

const NEW_CARD = "__new";

function LogDialog({ mode, tx, text: initialText, voiceEnabled, currency, history, cards, onClose }: { mode: Mode; tx?: Transaction; text?: string; voiceEnabled: boolean; currency: string; history: Suggestion[]; cards: CreditCard[]; onClose: () => void }) {
  const router = useRouter();
  const symbol = currencySymbol(currency);
  const { toast, confirm } = useFeedback();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [step, setStep] = useState<"capture" | "confirm">(mode === "voice" && !tx ? "capture" : "confirm");
  const [draft, setDraft] = useState<Draft>(tx ? { ...tx, amount: String(tx.amount) } : blank());
  const [text, setText] = useState(initialText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "transcribing" | "parsing" | "saving">(null);
  const [recording, setRecording] = useState(false);
  const [saving, startSave] = useTransition();
  // Where the money comes from (income) or goes (expense). Only chosen for new entries.
  const [fund, setFund] = useState<FundsSource>("cash");
  const [loanName, setLoanName] = useState("");
  const [repayment, setRepayment] = useState("");
  const [months, setMonths] = useState("");
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [cardPopup, setCardPopup] = useState(false);
  const closeCardPopup = useCallback(() => setCardPopup(false), []);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const cancelled = useRef(false);
  const starting = useRef(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // The card popup handles its own Escape.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !cardPopup && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, cardPopup]);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= 30) recorder.current?.stop();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const autoParsed = useRef(false);
  useEffect(() => {
    if (initialText?.trim() && !autoParsed.current) {
      autoParsed.current = true;
      void parse(initialText);
    } else if (mode === "voice" && !tx && !initialText && voiceEnabled) {
      void toggleRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestParse(input: string): Promise<TxInput> {
    const res = await fetch("/api/voice/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input, today: todayISO() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Couldn't parse that.");
    return data.transaction as TxInput;
  }

  // Typed input: parse, then let the user confirm before saving.
  async function parse(input: string) {
    setError(null);
    setBusy("parsing");
    try {
      const t = await requestParse(input);
      setDraft({ ...t, amount: String(t.amount), source: "voice" });
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't parse that.");
    } finally {
      setBusy(null);
    }
  }

  // Voice input: transcribe, parse and save in one go, then report what was logged.
  async function logFromAudio(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", new File([blob], "voice.webm", { type: blob.type || "audio/webm" }));
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed.");
      const transcript = String(data.text ?? "").trim();
      if (cancelled.current) return;
      if (!transcript) throw new Error("I didn't catch anything. Try again.");
      setText(transcript);

      setBusy("parsing");
      const t = await requestParse(transcript);
      if (cancelled.current) return;

      setBusy("saving");
      const saved = await saveTransaction({ ...t, source: "voice" });
      if (saved.error || !saved.id) throw new Error(saved.error ?? "Couldn't save the transaction.");

      const name = t.description || CATEGORY_META[t.category].label;
      const id = saved.id;
      toast(`${t.type === "income" ? "Income" : t.type === "savings" ? "Savings" : "Expense"} logged by voice`, "success", {
        quote: transcript,
        details: [
          { label: "Name", value: name },
          { label: "Amount", value: money(t.amount, currency) },
          { label: "Category", value: CATEGORY_META[t.category].label },
        ],
        action: {
          label: "Undo",
          onClick: async () => {
            const res = await deleteTransaction(id);
            toast(res.error ?? "Entry removed.", res.error ? "error" : "info");
            router.refresh();
          },
        },
      });
      router.refresh();
      onClose();
    } catch (e) {
      if (cancelled.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (starting.current || recorder.current) return;
    starting.current = true;
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      setLiveStream(media);
      const rec = new MediaRecorder(media);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        setLiveStream(null);
        setRecording(false);
        recorder.current = null;
        if (cancelled.current) return;
        if (!chunks.length) return setError("I didn't catch anything. Try again.");
        setBusy("transcribing");
        void logFromAudio(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone access was denied.");
    } finally {
      starting.current = false;
    }
  }
  // confirm() must run outside startTransition: its state update would otherwise be deferred until the transition ends.
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (draft.id) {
      const ok = await confirm({
        title: "Save changes?",
        message: `This will update "${draft.description || CATEGORY_META[draft.category as Category].label}" in your ledger.`,
        confirmLabel: "Save changes",
      });
      if (!ok) return;
    }
    startSave(async () => {
      const amountNum = Number(draft.amount);
      const loan = !draft.id && draft.type === "income" && fund === "loan";
      const card = !draft.id && draft.type === "expense" && fund === "card";
      const res = loan
        ? await saveLoanIncome({ name: loanName, amount: amountNum, repayment: Number(repayment), start_date: draft.occurred_on, months: Number(months) })
        : card
          ? await saveCardExpense({ amount: amountNum, description: draft.description, category: draft.category as Category, occurred_on: draft.occurred_on, card_id: cardId })
          : await saveTransaction({ ...draft, amount: amountNum } as Partial<TxInput>);
      if (res.error) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      const amount = money(amountNum, currency);
      toast(
        loan ? `Loan of ${amount} added to cash and installment created.`
          : card ? `${amount} charged to card and added to its items.`
          : draft.id ? "Transaction updated." : `${draft.type === "income" ? "Income" : draft.type === "savings" ? "Savings" : "Expense"} of ${amount} added.`,
      );
      router.refresh();
      onClose();
    });
  }

  async function remove() {
    if (!draft.id) return;
    const ok = await confirm({
      title: "Delete this transaction?",
      message: `"${draft.description || CATEGORY_META[draft.category as Category].label}" (${money(Number(draft.amount), currency)}) will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    startSave(async () => {
      const res = await deleteTransaction(draft.id!);
      if (res.error) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      toast("Transaction deleted.");
      router.refresh();
      onClose();
    });
  }

  const categories = categoriesFor(draft.type);
  const loanMode = !draft.id && draft.type === "income" && fund === "loan";
  const cardMode = !draft.id && draft.type === "expense" && fund === "card";
  const sourceChoices: FundsSource[] | null = draft.id ? null : draft.type === "income" ? ["cash", "loan"] : draft.type === "expense" ? ["cash", "card"] : null;
  const planTotal = Number(repayment) * Number(months);
  const received = Number(draft.amount);

  const query = draft.description.trim().toLowerCase();
  const suggestions =
    !draft.id && showSuggestions && query
      ? history.filter((h) => h.description.toLowerCase().includes(query) && !(h.description.toLowerCase() === query && h.type === draft.type && String(h.amount) === draft.amount)).slice(0, 6)
      : [];

  function pick(s: Suggestion) {
    setDraft((d) => ({ ...d, type: s.type, category: s.category, amount: String(s.amount), description: s.description }));
    setShowSuggestions(false);
    setActiveIdx(-1);
  }

  function onDescriptionKey(e: React.KeyboardEvent) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]); }
    else if (e.key === "Escape") { e.stopPropagation(); setShowSuggestions(false); }
  }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Log transaction" className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-float">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {tx ? "Edit transaction" : step === "capture" ? "Voice log" : draft.source === "voice" ? "Confirm transaction" : "New transaction"}
            </h2>
            {step === "capture" && <p className="text-sm text-muted">Speak or type, e.g. “Spent ₱420 on groceries at SM Supermarket”.</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-track"><X size={18} /></button>
        </div>

        {step === "capture" ? (
          <div className="mt-5 flex flex-col gap-4">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={!voiceEnabled || busy !== null}
              title={voiceEnabled ? undefined : "Set GEMINI_API_KEY to enable voice"}
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white transition disabled:opacity-60 ${recording ? "mic-recording bg-rose" : "mic-glow bg-brand-strong hover:opacity-90"}`}
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              {busy ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}
            </button>
            <Waveform stream={liveStream} active={recording} />
            <p className="text-center text-xs text-muted" aria-live="polite">
              {busy === "transcribing" ? "Transcribing…" : busy === "parsing" ? "Understanding…" : busy === "saving" ? "Saving…" : recording ? `Listening… ${seconds}s · tap to stop and log` : voiceEnabled ? "Tap to record" : "Voice needs a Gemini key — type instead"}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) parse(text); }} className="flex gap-2">
              <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type a transaction…" autoFocus maxLength={500} />
              <button className="btn-primary" disabled={busy !== null || !text.trim()}>Parse</button>
            </form>
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => setStep("confirm")}>Enter details manually</button>
            {error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-track p-1" role="radiogroup" aria-label="Type">
              {(["expense", "income", "savings"] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={draft.type === t}
                  onClick={() => { setDraft((d) => ({ ...d, type: t, category: categoriesFor(t)[0] })); setFund("cash"); }}
                  className={`rounded-md py-1.5 text-sm font-semibold capitalize transition ${draft.type === t ? "bg-card shadow-card" : "text-muted"}`}>
                  {t}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {loanMode ? "Loan amount received" : "Amount"}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{symbol}</span>
                <input className="field pl-8" inputMode="decimal" type="number" step="0.01" min="0.01" required value={draft.amount} onChange={(e) => set("amount", e.target.value)} autoFocus />
              </div>
            </label>
            {sourceChoices && (
              <div className="flex flex-col gap-1 text-sm font-medium">
                {draft.type === "income" ? "Source" : "Paid with"}
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-track p-1" role="radiogroup" aria-label="Source">
                  {sourceChoices.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={fund === s} onClick={() => { setFund(s); if (s === "card" && cards.length === 0) setCardPopup(true); }}
                      className={`rounded-md py-1.5 text-sm font-semibold capitalize transition ${fund === s ? "bg-card shadow-card" : "text-muted"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-normal text-muted">
                  {fund === "loan" ? "Adds the loan to your cash and creates an installment in Reminders."
                    : fund === "card" ? "Not deducted from cash. It's added to the card's items and deducted when you pay the card."
                    : draft.type === "income" ? "Added to your cash." : "Deducted from your cash."}
                </p>
              </div>
            )}
            {draft.id && tx?.origin && (
              <p className="rounded-lg bg-track px-3 py-2 text-xs text-muted">
                {tx.detail ?? "Created from Reminders"}. Changes here won&apos;t update the linked reminder.
              </p>
            )}
            {loanMode && (
              <>
                <label className="flex flex-col gap-1 text-sm font-medium">Loan name
                  <input className="field" maxLength={80} required value={loanName} onChange={(e) => setLoanName(e.target.value)} placeholder="e.g. Salary loan, SSS loan" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm font-medium">Repayment / month
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{symbol}</span>
                      <input className="field pl-8" inputMode="decimal" type="number" step="0.01" min="0.01" required value={repayment} onChange={(e) => setRepayment(e.target.value)} />
                    </div>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium">Plan (months)
                    <input className="field" type="number" min="1" max="600" step="1" required value={months} onChange={(e) => setMonths(e.target.value)} />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm font-medium">Date started
                  <input className="field" type="date" required value={draft.occurred_on} onChange={(e) => set("occurred_on", e.target.value)} />
                </label>
                {planTotal > 0 && (
                  <p className="rounded-lg bg-track px-3 py-2 text-xs text-muted">
                    Total repayment <span className="font-semibold text-ink">{money(planTotal, currency)}</span>
                    {received > 0 && (planTotal >= received ? <> · interest &amp; fees <span className="font-semibold text-ink">{money(planTotal - received, currency)}</span></> : null)}
                    {draft.occurred_on && Number(months) > 0 ? <> · first payment <span className="font-semibold text-ink">{dateLabel(installmentDue(draft.occurred_on, 0))}</span></> : null}
                  </p>
                )}
              </>
            )}
            {!loanMode && (
            <>
            <div className="relative flex flex-col gap-1 text-sm font-medium">
              <label htmlFor="log-description">Merchant / description</label>
              <input
                id="log-description"
                className="field"
                maxLength={120}
                autoComplete="off"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls="log-suggestions"
                aria-autocomplete="list"
                value={draft.description}
                onChange={(e) => { set("description", e.target.value); setShowSuggestions(true); setActiveIdx(-1); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                onKeyDown={onDescriptionKey}
              />
              {suggestions.length > 0 && (
                <ul id="log-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-float">
                  {suggestions.map((s, i) => (
                    <li key={`${s.type}-${s.description}`} role="option" aria-selected={i === activeIdx}
                      onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === activeIdx ? "bg-track" : "hover:bg-track"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{s.description}</span>
                        <span className="block text-xs font-normal text-muted capitalize">{s.type} · {CATEGORY_META[s.category].label}</span>
                      </span>
                      <span className="text-sm font-bold">{money(s.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Category
                <select className="field" value={draft.category} onChange={(e) => set("category", e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Date
                <input className="field" type="date" required value={draft.occurred_on} onChange={(e) => set("occurred_on", e.target.value)} />
              </label>
            </div>
            {cardMode && (
              <label className="flex flex-col gap-1 text-sm font-medium">Credit card
                <select className="field" required value={cardId} onChange={(e) => (e.target.value === NEW_CARD ? setCardPopup(true) : setCardId(e.target.value))}>
                  {cards.length === 0 && <option value="">No cards yet</option>}
                  {cards.map((c) => <option key={c.id} value={c.id}>{c.name} · due every {ordinal(c.due_day)}</option>)}
                  <option value={NEW_CARD}>+ Add a new card…</option>
                </select>
              </label>
            )}
            </>
            )}
            {error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
            <div className="flex gap-2">
              {draft.id && <button type="button" onClick={remove} className="btn-secondary text-rose" disabled={saving}>Delete</button>}
              <button className="btn-primary flex-1" disabled={saving}><BusyLabel busy={saving} label={draft.source === "voice" && !draft.id ? "Confirm & save" : "Save"} /></button>
            </div>
          </form>
        )}
      </div>
    </div>
    {cardPopup && <CardDialog onClose={closeCardPopup} onCreated={setCardId} />}
    </>
  );
}



