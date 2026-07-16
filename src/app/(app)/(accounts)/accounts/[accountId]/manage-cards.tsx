"use client";

import { KeyRound, LinkIcon, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/data/copy-button";
import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { proxyFetch } from "@/lib/api/client";
import { UpstreamApiError } from "@/lib/api/errors";
import type {
  AdminAccountItem,
  AdminAccountLimits,
  AdminAccountMembers,
  AdminApiTokenCreateResponse,
  AdminApiTokens,
  AdminRecoveryLink,
} from "@/types/admin";

const ROLES = ["owner", "admin", "viewer"] as const;
const PLANS = ["free", "pro", "enterprise"] as const;

// account_limits columns editable from the panel, in display order.
const LIMIT_FIELDS: { key: keyof AdminAccountLimits & string; label: string }[] = [
  { key: "max_cameras", label: "Max cameras" },
  { key: "max_concurrent_sessions", label: "Max concurrent sessions" },
  { key: "max_fps", label: "Max FPS" },
  { key: "max_width", label: "Max width" },
  { key: "max_height", label: "Max height" },
  { key: "max_bitrate_kbps", label: "Max bitrate (kbps)" },
  { key: "monthly_minutes_quota", label: "Monthly minutes quota" },
  { key: "snapshot_storage_mb", label: "Snapshot storage (MB)" },
];
const FIELD =
  "rounded-xl bg-white/[0.06] border border-white/20 px-3 py-1.5 text-sm text-[var(--dn-text)] placeholder:text-[var(--dn-text-50)] focus:outline-none focus:border-[var(--dn-creek-mid)] transition";
const CARD_LABEL =
  "text-[11px] uppercase tracking-[0.14em] text-[var(--dn-text-50)] font-mono";

function errorMessage(err: unknown): string {
  if (err instanceof UpstreamApiError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// Identity (name / slug)
// ---------------------------------------------------------------------------

export function IdentityCard({
  account,
  onChanged,
}: {
  account: AdminAccountItem;
  onChanged: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [slug, setSlug] = useState(account.slug);
  const [busy, setBusy] = useState(false);
  const dirty = name !== account.name || slug !== account.slug;

  async function save() {
    setBusy(true);
    try {
      await proxyFetch(`/v1/admin/accounts/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(name !== account.name ? { name } : {}),
          ...(slug !== account.slug ? { slug } : {}),
        }),
      });
      toast.success("Account identity updated");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dn-tile px-5 py-4 space-y-3">
      <p className={CARD_LABEL}>Identity</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-[var(--dn-text-70)] space-y-1 block">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${FIELD} w-full`}
          />
        </label>
        <label className="text-xs text-[var(--dn-text-70)] space-y-1 block">
          <span>Slug (lowercase, dashes)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            pattern="[a-z0-9][a-z0-9-]*"
            className={`${FIELD} w-full font-mono`}
          />
        </label>
      </div>
      {dirty ? (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setName(account.name);
              setSlug(account.slug);
            }}
            className="rounded-full px-3.5 py-1.5 text-sm text-[var(--dn-text-70)] hover:text-[var(--dn-text)] transition"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="dn-grad-btn px-4 py-1.5 text-sm font-bold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members (add / role / remove / recovery link)
// ---------------------------------------------------------------------------

export function MembersCard({
  accountId,
  members,
  onChanged,
}: {
  accountId: string;
  members: AdminAccountMembers | undefined;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("viewer");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState<AdminRecoveryLink | null>(null);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await proxyFetch(`/v1/admin/accounts/${accountId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          role,
          password: password || undefined,
        }),
      });
      toast.success(`Added ${email.trim()} as ${role}`);
      setEmail("");
      setPassword("");
      setAdding(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, nextRole: string) {
    try {
      await proxyFetch(`/v1/admin/accounts/${accountId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      toast.success("Role updated");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function removeMember(userId: string, label: string) {
    if (!window.confirm(`Remove ${label} from this account?`)) return;
    try {
      await proxyFetch(`/v1/admin/accounts/${accountId}/members/${userId}`, {
        method: "DELETE",
      });
      toast.success("Member removed");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function mintRecoveryLink(memberEmail: string) {
    try {
      const link = await proxyFetch<AdminRecoveryLink>("/v1/admin/users/recovery-link", {
        method: "POST",
        body: JSON.stringify({ email: memberEmail }),
      });
      setRecoveryLink(link);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="dn-tile px-5 py-4">
      <div className="flex items-center justify-between">
        <p className={CARD_LABEL}>Members ({members?.members.length ?? "…"})</p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="dn-btn dn-glow-soft flex items-center gap-1.5 px-3 py-1 text-xs font-bold"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            {adding ? "Cancel" : "Add member"}
          </span>
        </button>
      </div>

      {adding ? (
        <form onSubmit={addMember} className="mt-3 space-y-2 rounded-xl bg-white/[0.04] p-3">
          <div className="flex gap-2 flex-wrap">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@company.com"
              className={`${FIELD} flex-1 min-w-40`}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className={FIELD}
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#211a11]">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            placeholder="Password — only if this email has no Upstream login yet"
            className={`${FIELD} w-full`}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="dn-grad-btn px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      ) : null}

      {recoveryLink ? (
        <div className="mt-3 rounded-xl bg-white/[0.04] border border-[var(--dn-creek-mid)]/40 p-3 text-xs space-y-1">
          <p className="font-bold">
            Recovery link for {recoveryLink.email}{" "}
            <span className="text-[var(--dn-text-50)] font-normal">
              (shown once — deliver it out of band)
            </span>
          </p>
          <p className="font-mono break-all text-[var(--dn-text-70)]">
            {recoveryLink.action_link} <CopyButton value={recoveryLink.action_link} />
          </p>
          <button
            type="button"
            onClick={() => setRecoveryLink(null)}
            className="text-[var(--dn-text-50)] hover:text-[var(--dn-text)]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {members ? (
        members.members.length === 0 ? (
          <p className="text-sm text-[var(--dn-text-50)] mt-3">No members.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.members.map((m) => {
              const label = m.email ?? m.user_id;
              return (
                <li key={m.user_id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {m.email ?? <span className="font-mono text-xs">{m.user_id}</span>}
                  </span>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.user_id, e.target.value)}
                    className={`${FIELD} !py-1 !text-xs ml-auto`}
                    aria-label={`Role for ${label}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-[#211a11]">
                        {r}
                      </option>
                    ))}
                  </select>
                  {m.email ? (
                    <button
                      type="button"
                      title="Generate password-recovery link"
                      onClick={() => mintRecoveryLink(m.email as string)}
                      className="text-[var(--dn-text-50)] hover:text-[var(--dn-creek-mid)] transition"
                    >
                      <LinkIcon className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="Remove member"
                    onClick={() => removeMember(m.user_id, label)}
                    className="text-[var(--dn-text-50)] hover:text-[#e15a4c] transition"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <p className="text-sm text-[var(--dn-text-50)] mt-3">Loading…</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API tokens (issue / revoke)
// ---------------------------------------------------------------------------

export function TokensCard({
  accountId,
  tokens,
  onChanged,
}: {
  accountId: string;
  tokens: AdminApiTokens | undefined;
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await proxyFetch<AdminApiTokenCreateResponse>(
        `/v1/admin/accounts/${accountId}/api-tokens`,
        { method: "POST", body: JSON.stringify({ name: name.trim() }) },
      );
      setPlaintext(created.plaintext);
      setName("");
      setCreating(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(tokenId: string, label: string) {
    if (!window.confirm(`Revoke token "${label}"? Agents using it stop authenticating.`)) {
      return;
    }
    try {
      await proxyFetch(`/v1/admin/accounts/${accountId}/api-tokens/${tokenId}`, {
        method: "DELETE",
      });
      toast.success("Token revoked");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="dn-tile px-5 py-4">
      <div className="flex items-center justify-between">
        <p className={CARD_LABEL}>API tokens ({tokens?.tokens.length ?? "…"})</p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="dn-btn dn-glow-soft flex items-center gap-1.5 px-3 py-1 text-xs font-bold"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            {creating ? "Cancel" : "Issue token"}
          </span>
        </button>
      </div>

      {creating ? (
        <form onSubmit={createToken} className="mt-3 flex gap-2 rounded-xl bg-white/[0.04] p-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. dock-agent)"
            className={`${FIELD} flex-1`}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="dn-grad-btn px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            {busy ? "Issuing…" : "Issue"}
          </button>
        </form>
      ) : null}

      {plaintext ? (
        <div className="mt-3 rounded-xl bg-white/[0.04] border border-[var(--dn-creek-mid)]/40 p-3 text-xs space-y-1">
          <p className="font-bold">
            Token plaintext{" "}
            <span className="text-[var(--dn-text-50)] font-normal">
              (shown once — it is not stored anywhere)
            </span>
          </p>
          <p className="font-mono break-all text-[var(--dn-text-70)]">
            {plaintext} <CopyButton value={plaintext} label="token" />
          </p>
          <button
            type="button"
            onClick={() => setPlaintext(null)}
            className="text-[var(--dn-text-50)] hover:text-[var(--dn-text)]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {tokens ? (
        tokens.tokens.length === 0 ? (
          <p className="text-sm text-[var(--dn-text-50)] mt-3">No tokens issued.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tokens.tokens.map((t) => (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 truncate">{t.name}</span>
                <span className="text-[var(--dn-text-50)] font-mono text-xs">
                  {t.prefix}…{t.last_four}
                </span>
                {t.revoked_at ? <StatusBadge status="revoked" /> : null}
                <span className="ml-auto text-[var(--dn-text-50)] text-xs">
                  {t.last_used_at ? (
                    <>
                      used <RelativeTime value={t.last_used_at} />
                    </>
                  ) : (
                    "never used"
                  )}
                </span>
                {!t.revoked_at ? (
                  <button
                    type="button"
                    title="Revoke token"
                    onClick={() => revoke(t.id, t.name)}
                    className="text-[var(--dn-text-50)] hover:text-[#e15a4c] transition"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-sm text-[var(--dn-text-50)] mt-3">Loading…</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan & status (plan select + suspend/reactivate)
// ---------------------------------------------------------------------------

export function PlanAndStatusCard({
  account,
  onChanged,
}: {
  account: AdminAccountItem;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function patch(body: { plan?: string; status?: string }, label: string) {
    setBusy(true);
    try {
      await proxyFetch(`/v1/admin/accounts/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(label);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const suspended = account.status === "suspended";

  return (
    <div className="dn-tile px-5 py-4 space-y-4">
      <p className={CARD_LABEL}>Plan &amp; status</p>
      <div className="flex items-center gap-2">
        <label htmlFor="plan" className="text-sm text-[var(--dn-text-70)] w-16">
          Plan
        </label>
        <select
          id="plan"
          value={account.plan}
          disabled={busy}
          onChange={(e) => patch({ plan: e.target.value }, `Plan set to ${e.target.value}`)}
          className="rounded-xl bg-white/[0.06] border border-white/20 px-3 py-1.5 text-sm text-[var(--dn-text)] focus:outline-none focus:border-[var(--dn-creek-mid)]"
        >
          {PLANS.map((p) => (
            <option key={p} value={p} className="bg-[#211a11] text-[var(--dn-text)]">
              {p}
            </option>
          ))}
          {!PLANS.includes(account.plan as (typeof PLANS)[number]) ? (
            <option value={account.plan} className="bg-[#211a11] text-[var(--dn-text)]">
              {account.plan}
            </option>
          ) : null}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--dn-text-70)] w-16">Status</span>
        <StatusBadge status={account.status} />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const next = suspended ? "active" : "suspended";
            if (
              !suspended &&
              !window.confirm(
                `Suspend ${account.name}? New stream sessions will be rejected with account_suspended. In-flight sessions keep running.`,
              )
            ) {
              return;
            }
            patch({ status: next }, suspended ? "Account reactivated" : "Account suspended");
          }}
          className={
            suspended
              ? "ml-auto rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-[var(--dn-creek-mid)] hover:bg-white/5 transition disabled:opacity-50"
              : "ml-auto rounded-full border border-[rgba(225,90,76,0.4)] px-3.5 py-1.5 text-sm text-[#e89e93] hover:bg-[rgba(225,90,76,0.1)] transition disabled:opacity-50"
          }
        >
          {suspended ? "Reactivate" : "Suspend"}
        </button>
      </div>
      <p className="text-xs text-[var(--dn-text-50)]">
        Suspension blocks new stream sessions only; it does not kill in-flight ones. Every
        change here is written to the audit log.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Limits (account_limits editor)
// ---------------------------------------------------------------------------

export function LimitsCard({
  accountId,
  limits,
  onChanged,
}: {
  accountId: string;
  limits: AdminAccountLimits | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!limits) {
    return (
      <div className="dn-tile px-5 py-4">
        <p className={CARD_LABEL}>Limits</p>
        <p className="text-sm text-[var(--dn-text-50)] mt-2">
          No account_limits row configured for this account.
        </p>
      </div>
    );
  }

  const changes: Record<string, number> = {};
  for (const [key, raw] of Object.entries(draft)) {
    if (raw === "") continue;
    const parsed = Number(raw);
    const current = limits[key as keyof AdminAccountLimits];
    if (!Number.isNaN(parsed) && parsed !== current) changes[key] = parsed;
  }
  const dirty = Object.keys(changes).length > 0;

  async function save() {
    setBusy(true);
    try {
      await proxyFetch(`/v1/admin/accounts/${accountId}/limits`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      toast.success("Limits updated");
      setDraft({});
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dn-tile px-5 py-4">
      <div className="flex items-center justify-between">
        <p className={CARD_LABEL}>Limits</p>
        <span className="text-xs text-[var(--dn-text-50)]">
          updated <RelativeTime value={limits.updated_at} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
        {LIMIT_FIELDS.map(({ key, label }) => (
          <label key={key} className="text-xs text-[var(--dn-text-70)] space-y-1 block">
            <span>{label}</span>
            <input
              type="number"
              min={0}
              value={draft[key] ?? String(limits[key])}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              className="w-full rounded-lg bg-white/[0.06] border border-white/20 px-2.5 py-1.5 text-sm text-[var(--dn-text)] font-mono focus:outline-none focus:border-[var(--dn-creek-mid)]"
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-[var(--dn-text-50)] mt-3">
        Allowed codecs: <span className="font-mono">{limits.allowed_codecs.join(", ")}</span>.
        Limit changes apply to future sessions only.
      </p>
      <div className="flex justify-end gap-2 mt-3">
        {dirty ? (
          <button
            type="button"
            onClick={() => setDraft({})}
            className="rounded-full px-3.5 py-1.5 text-sm text-[var(--dn-text-70)] hover:text-[var(--dn-text)] transition"
          >
            Reset
          </button>
        ) : null}
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={save}
          className="dn-grad-btn font-bold px-4 py-1.5 text-sm transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "Saving…" : "Save limits"}
        </button>
      </div>
    </div>
  );
}
