"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "System" },
  { href: "/streams", label: "Streams" },
  { href: "/accounts", label: "Accounts" },
  { href: "/usage", label: "Usage" },
  { href: "/audit-log", label: "Audit log" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

async function signOut() {
  await fetch("/api/auth/sign-out", { method: "POST" });
  window.location.href = "/login";
}

export function Topbar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <header className="glass rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap">
      <Link href="/" className="flex items-baseline gap-2 mr-2">
        <span className="text-xs uppercase tracking-[0.18em] text-accent mono">
          upstream
        </span>
        <span className="display font-semibold">admin</span>
      </Link>
      <nav className="flex items-center gap-1 flex-wrap">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm transition",
              isActive(pathname, link.href)
                ? "bg-glass-bg border border-glass-stroke text-ink"
                : "text-ink-soft hover:text-ink hover:bg-white/5",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {email ? <span className="text-xs text-ink-mute mono">{email}</span> : null}
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-glass-stroke px-3.5 py-1.5 text-sm text-ink-soft hover:text-ink hover:bg-white/5 transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
