"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/data/copy-button";
import { PageHeader } from "@/components/data/page-header";
import { StatusBadge } from "@/components/data/status-badge";
import { proxyFetch } from "@/lib/api/client";
import { UpstreamApiError } from "@/lib/api/errors";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamDetail } from "@/types/admin";

function ForceStopButton({
  sessionId,
  cameraName,
  onStopped,
}: {
  sessionId: string;
  cameraName: string | null;
  onStopped: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function stop() {
    if (
      !window.confirm(
        `Force-stop this session${cameraName ? ` (${cameraName})` : ""}? ` +
          "It ends immediately with reason admin_forced; the agent can start a new one.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await proxyFetch(`/v1/admin/streams/${sessionId}/stop`, { method: "POST" });
      toast.success("Session force-stopped");
      onStopped();
    } catch (err) {
      toast.error(
        err instanceof UpstreamApiError ? `${err.code}: ${err.message}` : String(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={stop}
      className="rounded-full border border-[rgba(225,90,76,0.4)] px-3.5 py-1.5 text-sm font-bold text-[#e89e93] hover:bg-[rgba(225,90,76,0.1)] transition disabled:opacity-50"
    >
      {busy ? "Stopping…" : "Force stop"}
    </button>
  );
}

// Persistent session header — rendered by the detail layout so it stays visible
// across the Overview/Validations/Reliability tabs. Fetches the same detail
// endpoint the tab clients use; SWR dedupes the shared key, so this is one
// request. mutate() refreshes the shared cache after a force-stop.
export function StreamDetailHeader({ sessionId }: { sessionId: string }) {
  const { data, mutate } = useUpstreamList<AdminStreamDetail>(
    `/v1/admin/streams/${sessionId}`,
    { refreshInterval: 10_000 },
  );

  const s = data?.session;

  return (
    <PageHeader
      eyebrow={s ? `${s.account_name} /${s.account_slug}` : "session"}
      title="Session"
      accent={s?.camera_name ?? "detail"}
      description={
        <span className="font-mono text-xs flex items-center gap-1">
          {s?.id ?? sessionId} <CopyButton value={s?.id ?? sessionId} />
        </span>
      }
      actions={
        s ? (
          <div className="flex items-center gap-3">
            {s.state === "approved" || s.state === "streaming" ? (
              <ForceStopButton
                sessionId={s.id}
                cameraName={s.camera_name}
                onStopped={() => void mutate()}
              />
            ) : null}
            <StatusBadge status={s.state} />
          </div>
        ) : undefined
      }
    />
  );
}
