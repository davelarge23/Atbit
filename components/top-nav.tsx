"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { useLog } from "@/components/log-dialog";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { signOut } from "@/app/(app)/actions";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/reminders", label: "Reminders" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({ name, dueCount }: { name: string; dueCount: number }) {
  const pathname = usePathname();
  const { open } = useLog();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Atbit home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <NavLink key={l.href} href={l.href} active={active}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${active ? "bg-track text-ink" : "text-muted hover:bg-track hover:text-ink"}`}>
                  {l.label}
                  {l.href === "/reminders" && dueCount > 0 && <span className="ml-1.5 rounded-full bg-rose px-1.5 py-0.5 text-[10px] font-bold text-white">{dueCount}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => open("voice")} className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:opacity-80">
            <Mic size={14} /> <span className="hidden sm:inline">Voice Log</span>
          </button>
          <button onClick={() => open("manual")} aria-label="Add transaction" className="rounded-full border border-line p-1.5 text-muted hover:bg-track hover:text-ink">
            <Plus size={16} />
          </button>
          <span title={name} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-strong text-sm font-semibold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden" aria-label="Main mobile">
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <NavLink key={l.href} href={l.href} active={active} className={`whitespace-nowrap rounded-lg px-3 py-1 text-sm font-semibold ${active ? "bg-track" : "text-muted"}`}>{l.label}{l.href === "/reminders" && dueCount > 0 && <span className="ml-1.5 rounded-full bg-rose px-1.5 py-0.5 text-[10px] font-bold text-white">{dueCount}</span>}</NavLink>
          );
        })}
      </nav>
    </header>
  );
}
