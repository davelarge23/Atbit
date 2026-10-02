"use client";

import { useState } from "react";
import { Mic, Plus, Sparkles } from "lucide-react";
import { useLog } from "@/components/log-dialog";

export function Greeting({ name }: { name: string }) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return (
    <h1 className="text-3xl font-bold tracking-tight sm:text-[44px] sm:leading-[52px]" suppressHydrationWarning>
      Good {part}, {name}
    </h1>
  );
}

export function QuickLogBar() {
  const { open } = useLog();
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) open("voice", undefined, text);
        else open("voice");
      }}
      className="card flex items-center gap-2 p-2"
    >
      <Sparkles size={16} className="ml-2 shrink-0 text-brand" />
      <input
        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted"
        placeholder="Quick log: “Paid ₱1,250 for electricity bill”"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Quick log"
      />
      <button type="button" onClick={() => open("voice")} aria-label="Voice log" className="rounded-lg p-2 text-brand hover:bg-brand-soft"><Mic size={18} /></button>
      <button type="button" onClick={() => open("manual")} aria-label="Add manually" className="rounded-lg p-2 text-muted hover:bg-track"><Plus size={18} /></button>
    </form>
  );
}

export function VoicePanel() {
  const { open, voiceEnabled } = useLog();
  return (
    <section className="flex flex-col rounded-2xl bg-gradient-to-br from-brand-strong to-[#0f766e] p-6 text-white shadow-lift">
      <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Atbit Voice Engine</span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Zero-click bookkeeping</h2>
      <p className="mt-1 text-sm text-white/80">Speak your transaction naturally. We parse it, categorize it, and ask you to confirm before logging.</p>
      <ul className="mt-5 flex flex-col gap-2 text-sm">
        <li className="rounded-lg bg-white/10 px-3 py-2">“Spent ₱420 on groceries at SM Supermarket”</li>
        <li className="rounded-lg bg-white/10 px-3 py-2">“Paid ₱1,250 for electricity bill”</li>
        <li className="rounded-lg bg-white/10 px-3 py-2">“Saved ₱3,000 into my emergency fund”</li>
      </ul>
      <button onClick={() => open("voice")} className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand-strong hover:bg-white/90">
        <Mic size={16} /> {voiceEnabled ? "Start voice command" : "Log with text"}
      </button>
    </section>
  );
}


