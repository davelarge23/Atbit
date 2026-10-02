import type { Metadata } from "next";
import { ReminderForm } from "@/components/reminder-form";
import { ReminderRow } from "@/components/reminder-row";
import { requireUser } from "@/lib/session";
import { todayPH, type Reminder } from "@/lib/reminders";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const { supabase, profile } = await requireUser();
  const { data } = await supabase.from("reminders").select("*").order("due_date", { ascending: true });
  const reminders = ((data ?? []) as Reminder[]).map((r) => ({ ...r, amount: Number(r.amount) }));
  const today = todayPH();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted">Never miss an installment. Upcoming and overdue items also show on your dashboard.</p>
      </div>
      <ReminderForm currency={profile.currency} today={today} />
      <div className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>
        {reminders.length ? (
          <ul className="mt-2">{reminders.map((r) => <ReminderRow key={r.id} r={r} today={today} currency={profile.currency} manage />)}</ul>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No reminders yet. Add your first installment above.</p>
        )}
      </div>
    </div>
  );
}