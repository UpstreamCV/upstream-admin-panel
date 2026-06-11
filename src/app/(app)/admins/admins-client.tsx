"use client";

import { ShieldPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { proxyFetch } from "@/lib/api/client";
import { UpstreamApiError } from "@/lib/api/errors";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminMe, AdminPlatformAdmins } from "@/types/admin";

const FIELD =
  "rounded-xl bg-white/[0.06] border border-white/20 px-3 py-2 text-sm text-[var(--dn-text)] placeholder:text-[var(--dn-text-50)] focus:outline-none focus:border-[var(--dn-creek-mid)] transition";

function errorMessage(err: unknown): string {
  if (err instanceof UpstreamApiError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

export function AdminsClient() {
  const { data, mutate } = useUpstreamList<AdminPlatformAdmins>(
    "/v1/admin/platform-admins",
    { refreshInterval: 60_000 },
  );
  const me = useUpstreamList<AdminMe>("/v1/admin/me");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await proxyFetch("/v1/admin/platform-admins", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), note: note.trim() || undefined }),
      });
      toast.success(`${email.trim()} is now a platform admin`);
      setEmail("");
      setNote("");
      void mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(userId: string, label: string) {
    if (
      !window.confirm(
        `Revoke platform-admin access for ${label}? They keep their normal account login.`,
      )
    ) {
      return;
    }
    try {
      await proxyFetch(`/v1/admin/platform-admins/${userId}`, { method: "DELETE" });
      toast.success("Admin access revoked");
      void mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="access control"
        title="Platform"
        accent="admins"
        description="Who can use this panel. Grants require an existing Upstream login (the person must have signed in at least once). You cannot remove yourself."
      />

      <form
        onSubmit={addAdmin}
        className="dn-tile p-4 mb-5 flex gap-2 flex-wrap items-center"
      >
        <ShieldPlus
          className="h-4 w-4 text-[var(--dn-creek-mid)] shrink-0"
          aria-hidden
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@upstreamcv.com"
          className={`${FIELD} flex-1 min-w-48`}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (e.g. role)"
          className={`${FIELD} w-44`}
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="dn-grad-btn px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {busy ? "Granting…" : "Grant access"}
        </button>
      </form>

      <div className="dn-tile overflow-hidden">
        {data ? (
          <ul>
            {data.admins.map((admin) => {
              const isMe = admin.user_id === me.data?.user_id;
              return (
                <li
                  key={admin.user_id}
                  className="px-5 py-3.5 border-t first:border-t-0 border-[rgba(255,255,255,0.07)] flex items-center gap-3 text-sm"
                >
                  <span className="min-w-0 truncate font-bold">
                    {admin.email ?? (
                      <span className="font-mono text-xs font-normal">{admin.user_id}</span>
                    )}
                    {isMe ? (
                      <span className="ml-2 text-xs font-normal text-[var(--dn-creek-mid)]">
                        you
                      </span>
                    ) : null}
                  </span>
                  {admin.note ? (
                    <span className="text-[var(--dn-text-50)] text-xs">{admin.note}</span>
                  ) : null}
                  <span className="ml-auto text-[var(--dn-text-50)] text-xs">
                    since <RelativeTime value={admin.created_at} />
                  </span>
                  {!isMe ? (
                    <button
                      type="button"
                      title="Revoke admin access"
                      onClick={() =>
                        removeAdmin(admin.user_id, admin.email ?? admin.user_id)
                      }
                      className="text-[var(--dn-text-50)] hover:text-[#e15a4c] transition"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[var(--dn-text-50)] p-4">Loading…</p>
        )}
      </div>
    </div>
  );
}
