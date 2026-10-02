import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SettingsForm } from "@/components/settings-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile, user } = await requireUser();
  const jar = await cookies();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Manage your profile, budget targets and display preferences.</p>
      </div>
      <SettingsForm
        profile={profile}
        email={user.email ?? ""}
        dark={jar.get("pref_dark")?.value === "1"}
        large={jar.get("pref_large")?.value === "1"}
        motion={jar.get("pref_motion")?.value === "1"}
      />
    </div>
  );
}
