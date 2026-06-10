"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/data/copy-button";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { proxyFetch } from "@/lib/api/client";
import { UpstreamApiError } from "@/lib/api/errors";
import { useUpstreamList } from "@/lib/api/use-list";
import type {
  AdminAccountDetail,
  AdminAccountItem,
  AdminAccountLimits,
  AdminAccountMembers,
  AdminApiTokens,
} from "@/types/admin";

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

function errorMessage(err: unknown): string {
  if (err instanceof UpstreamApiError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

function PlanAndStatusCard({
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
    <div className="glass rounded-2xl px-5 py-4 space-y-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">
        Plan &amp; status
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="plan" className="text-sm text-ink-soft w-16">
          Plan
        </label>
        <select
          id="plan"
          value={account.plan}
          disabled={busy}
          onChange={(e) => patch({ plan: e.target.value }, `Plan set to ${e.target.value}`)}
          className="rounded-xl bg-glass-bg border border-glass-stroke px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-accent/60"
        >
          {PLANS.map((p) => (
            <option key={p} value={p} className="bg-base text-ink">
              {p}
            </option>
          ))}
          {!PLANS.includes(account.plan as (typeof PLANS)[number]) ? (
            <option value={account.plan} className="bg-base text-ink">
              {account.plan}
            </option>
          ) : null}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-soft w-16">Status</span>
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
              ? "ml-auto rounded-full border border-glass-stroke px-3.5 py-1.5 text-sm text-accent hover:bg-white/5 transition disabled:opacity-50"
              : "ml-auto rounded-full border border-[rgba(225,90,76,0.4)] px-3.5 py-1.5 text-sm text-[#e89e93] hover:bg-[rgba(225,90,76,0.1)] transition disabled:opacity-50"
          }
        >
          {suspended ? "Reactivate" : "Suspend"}
        </button>
      </div>
      <p className="text-xs text-ink-mute">
        Suspension blocks new stream sessions only; it does not kill in-flight ones.
        Every change here is written to the audit log.
      </p>
    </div>
  );
}

function LimitsCard({
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
      <div className="glass rounded-2xl px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">Limits</p>
        <p className="text-sm text-ink-mute mt-2">
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
    <div className="glass rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">Limits</p>
        <span className="text-xs text-ink-mute">
          updated <RelativeTime value={limits.updated_at} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
        {LIMIT_FIELDS.map(({ key, label }) => (
          <label key={key} className="text-xs text-ink-soft space-y-1 block">
            <span>{label}</span>
            <input
              type="number"
              min={0}
              value={draft[key] ?? String(limits[key])}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              className="w-full rounded-lg bg-glass-bg border border-glass-stroke px-2.5 py-1.5 text-sm text-ink mono focus:outline-none focus:border-accent/60"
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-mute mt-3">
        Allowed codecs: <span className="mono">{limits.allowed_codecs.join(", ")}</span>.
        Limit changes apply to future sessions only.
      </p>
      <div className="flex justify-end gap-2 mt-3">
        {dirty ? (
          <button
            type="button"
            onClick={() => setDraft({})}
            className="rounded-full px-3.5 py-1.5 text-sm text-ink-soft hover:text-ink transition"
          >
            Reset
          </button>
        ) : null}
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={save}
          className="rounded-full bg-ink text-[#181209] font-medium px-4 py-1.5 text-sm transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "Saving…" : "Save limits"}
        </button>
      </div>
    </div>
  );
}

export function AccountDetailClient({ accountId }: { accountId: string }) {
  const detail = useUpstreamList<AdminAccountDetail>(`/v1/admin/accounts/${accountId}`, {
    refreshInterval: 30_000,
  });
  const members = useUpstreamList<AdminAccountMembers>(
    `/v1/admin/accounts/${accountId}/members`,
    { refreshInterval: 60_000 },
  );
  const tokens = useUpstreamList<AdminApiTokens>(
    `/v1/admin/accounts/${accountId}/api-tokens`,
    { refreshInterval: 60_000 },
  );

  if (detail.error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-ink-soft">Account not found.</p>
        <Link href="/accounts" className="text-accent hover:underline text-sm">
          ← Back to accounts
        </Link>
      </div>
    );
  }
  if (!detail.data) {
    return <p className="text-ink-mute text-sm">Loading…</p>;
  }

  const { account, limits, usage_30d } = detail.data;
  const refresh = () => void detail.mutate();

  return (
    <div>
      <PageHeader
        eyebrow="account"
        title={account.name}
        accent={`/${account.slug}`}
        description={
          <span className="mono text-xs flex items-center gap-1">
            {account.id} <CopyButton value={account.id} />
          </span>
        }
        actions={
          <Link
            href={`/streams?account=${account.id}`}
            className="text-sm text-accent hover:underline"
          >
            View streams →
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <PlanAndStatusCard account={account} onChanged={refresh} />

          <div className="glass rounded-2xl px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">
              Usage (30 days)
            </p>
            {usage_30d.length === 0 ? (
              <p className="text-sm text-ink-mute mt-2">No usage recorded.</p>
            ) : (
              <dl className="mt-2 space-y-1.5">
                {usage_30d.map((u) => (
                  <div key={`${u.event_type}-${u.unit}`} className="flex justify-between text-sm">
                    <dt className="text-ink-soft mono text-xs">{u.event_type}</dt>
                    <dd className="mono">
                      {u.total_quantity.toLocaleString()} {u.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="glass rounded-2xl px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">
              Members ({members.data?.members.length ?? "…"})
            </p>
            {members.data ? (
              members.data.members.length === 0 ? (
                <p className="text-sm text-ink-mute mt-2">No members.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {members.data.members.map((m) => (
                    <li key={m.user_id} className="flex items-center gap-3 text-sm">
                      <span>{m.email ?? <span className="mono text-xs">{m.user_id}</span>}</span>
                      <span className="text-ink-mute mono text-xs uppercase">{m.role}</span>
                      <span className="ml-auto text-ink-mute text-xs">
                        <RelativeTime value={m.created_at} />
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="text-sm text-ink-mute mt-2">Loading…</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <LimitsCard accountId={accountId} limits={limits} onChanged={refresh} />

          <div className="glass rounded-2xl px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">
              API tokens ({tokens.data?.tokens.length ?? "…"})
            </p>
            {tokens.data ? (
              tokens.data.tokens.length === 0 ? (
                <p className="text-sm text-ink-mute mt-2">No tokens issued.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {tokens.data.tokens.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 text-sm">
                      <span>{t.name}</span>
                      <span className="text-ink-mute mono text-xs">
                        {t.prefix}…{t.last_four}
                      </span>
                      {t.revoked_at ? <StatusBadge status="revoked" /> : null}
                      <span className="ml-auto text-ink-mute text-xs">
                        {t.last_used_at ? (
                          <>
                            used <RelativeTime value={t.last_used_at} />
                          </>
                        ) : (
                          "never used"
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="text-sm text-ink-mute mt-2">Loading…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
