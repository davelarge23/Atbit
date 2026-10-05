"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "@/components/spinner";

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner size={12} className="ml-1.5 inline" /> : null;
}

/** A nav link that shows a spinner while its page is loading. */
export function NavLink({ href, active, className, children }: { href: string; active: boolean; className: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {children}
      <Pending />
    </Link>
  );
}
