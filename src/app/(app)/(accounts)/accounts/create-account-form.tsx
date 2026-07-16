"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { proxyFetch } from "@/lib/api/client";
import { UpstreamApiError } from "@/lib/api/errors";
import type { AdminAccountItem } from "@/types/admin";

const FIELD =
  "w-full rounded-xl bg-white/[0.06] border border-white/20 px-3 py-2 text-sm text-[var(--dn-text)] placeholder:text-[var(--dn-text-50)] focus:outline-none focus:border-[var(--dn-creek-mid)] transition";

// Inline expanding create form (no modal primitive in this app). Owner is
// optional: existing auth user by email, or a brand-new one when a password
// is supplied.
export function CreateAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("free");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await proxyFetch<AdminAccountItem>("/v1/admin/accounts", {
        method: "POST",
        body: JSON.stringify({
          name,
          plan,
          owner_email: ownerEmail.trim() || undefined,
          owner_password: ownerPassword || undefined,
        }),
      });
      toast.success(`Account "${created.name}" created`);
      router.push(`/accounts/${created.id}`);
    } catch (err) {
      toast.error(
        err instanceof UpstreamApiError ? `${err.code}: ${err.message}` : String(err),
      );
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dn-grad-btn dn-glow-btn flex items-center gap-2 px-4 py-2 text-sm font-bold"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden /> New account
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="dn-tile p-5 w-full max-w-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          New account
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[var(--dn-text-50)] hover:text-[var(--dn-text)]"
        >
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-[var(--dn-text-70)] space-y-1 block sm:col-span-2">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Robotics"
            className={FIELD}
          />
        </label>
        <label className="text-xs text-[var(--dn-text-70)] space-y-1 block">
          <span>Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={FIELD}>
            {["free", "pro", "enterprise"].map((p) => (
              <option key={p} value={p} className="bg-[#211a11]">
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--dn-text-70)] space-y-1 block">
          <span>Owner email (optional)</span>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@customer.com"
            className={FIELD}
          />
        </label>
        {ownerEmail.trim() ? (
          <label className="text-xs text-[var(--dn-text-70)] space-y-1 block sm:col-span-2">
            <span>
              Owner password — only needed if this email has no Upstream login yet
            </span>
            <input
              type="text"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              minLength={8}
              placeholder="leave blank for an existing user"
              className={FIELD}
            />
          </label>
        ) : null}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="dn-grad-btn px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
