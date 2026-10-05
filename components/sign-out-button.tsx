"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/spinner";

export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-label="Sign out" title="Sign out" className="rounded-full p-1.5 text-muted hover:bg-track hover:text-ink disabled:opacity-60">
      {pending ? <Spinner size={16} /> : <LogOut size={16} />}
    </button>
  );
}
