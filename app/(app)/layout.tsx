import { FeedbackProvider } from "@/components/feedback";
import { LogProvider } from "@/components/log-dialog";
import { TopNav } from "@/components/top-nav";
import { requireUser } from "@/lib/session";
import { addDaysISO, REMIND_DAYS, todayPH, type CreditCard } from "@/lib/reminders";
import type { Suggestion } from "@/components/log-dialog";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, profile } = await requireUser();
  const today = todayPH();
  const [recent, due, cardsRes] = await Promise.all([
    supabase.from("transactions").select("type, amount, category, description").neq("description", "").order("created_at", { ascending: false }).limit(300),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("status", "active").lte("due_date", addDaysISO(today, REMIND_DAYS)),
    supabase.from("credit_cards").select("id, name, due_day").order("created_at", { ascending: true }),
  ]);

  // Latest entry wins for each type + description pair.
  const seen = new Set<string>();
  const history: Suggestion[] = [];
  for (const t of recent.data ?? []) {
    const key = `${t.type}|${t.description.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    history.push({ type: t.type, amount: Number(t.amount), category: t.category, description: t.description });
  }

  return (
    <FeedbackProvider>
    <LogProvider voiceEnabled={Boolean(process.env.GEMINI_API_KEY)} currency={profile.currency} history={history} cards={(cardsRes.data ?? []) as CreditCard[]}>
      <TopNav name={profile.display_name} dueCount={due.count ?? 0} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pt-24">{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-5 text-xs text-muted sm:px-6">
        <span>© {new Date().getFullYear()} Atbit. Mindful wealth management. <span className="mx-1">·</span> Developed by Cristhan Dave + AI</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Encrypted &amp; synced</span>
      </footer>
    </LogProvider>
    </FeedbackProvider>
  );
}