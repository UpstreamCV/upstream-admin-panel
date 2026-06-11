"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/data/copy-button";
import { PageHeader } from "@/components/data/page-header";
import { AreaSpark, GraphTile } from "@/components/data/spark";
import { RelativeTime } from "@/components/data/relative-time";
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

function SpecCard({
  title,
  spec,
}: {
  title: string;
  spec: Record<string, unknown>;
}) {
  const entries = Object.entries(spec);
  const empty = entries.every(([, v]) => v === null || v === undefined);
  return (
    <div className="dn-tile px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--dn-text-50)] font-mono">{title}</p>
      {empty ? (
        <p className="text-sm text-[var(--dn-text-50)] mt-2">—</p>
      ) : (
        <dl className="mt-2 space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <dt className="text-[var(--dn-text-70)]">{k}</dt>
              <dd className="font-mono">{v === null || v === undefined ? "—" : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function StreamDetailClient({ sessionId }: { sessionId: string }) {
  const { data, error, mutate } = useUpstreamList<AdminStreamDetail>(
    `/v1/admin/streams/${sessionId}`,
    { refreshInterval: 10_000 },
  );

  if (error) {
    return (
      <div className="dn-tile p-8 text-center">
        <p className="text-[var(--dn-text-70)]">Session not found.</p>
        <Link href="/streams" className="text-[var(--dn-creek-mid)] hover:underline text-sm">
          ← Back to streams
        </Link>
      </div>
    );
  }
  if (!data) {
    return <p className="text-[var(--dn-text-50)] text-sm">Loading…</p>;
  }

  const s = data.session;

  return (
    <div>
      <PageHeader
        eyebrow={`${s.account_name} /${s.account_slug}`}
        title="Session"
        accent={s.camera_name ?? "detail"}
        description={
          <span className="font-mono text-xs flex items-center gap-1">
            {s.id} <CopyButton value={s.id} />
          </span>
        }
        actions={
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
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="dn-tile px-5 py-4 text-sm space-y-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--dn-text-50)] font-mono">
            Lifecycle
          </p>
          <p>
            created <RelativeTime value={s.created_at} />
          </p>
          <p>
            started{" "}
            {s.started_at ? <RelativeTime value={s.started_at} /> : <span>—</span>}
          </p>
          <p>
            ended {s.ended_at ? <RelativeTime value={s.ended_at} /> : <span>—</span>}
          </p>
          {s.end_reason ? <p className="font-mono text-xs">reason: {s.end_reason}</p> : null}
          {s.failure_code ? (
            <p className="font-mono text-xs text-[#e89e93]">failure: {s.failure_code}</p>
          ) : null}
        </div>
        <SpecCard title="Requested" spec={data.requested} />
        <SpecCard title="Approved" spec={data.approved} />
        <SpecCard title="Validated (ffprobe)" spec={data.validated} />
      </div>

      {data.heartbeats.length >= 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <GraphTile
            label="FPS"
            headline={data.heartbeats[0].fps?.toFixed(1) ?? "—"}
            hint={`last ${data.heartbeats.length} heartbeats`}
          >
            <AreaSpark
              values={[...data.heartbeats].reverse().map((hb) => hb.fps)}
              height={40}
            />
          </GraphTile>
          <GraphTile
            label="Bitrate (kbps)"
            headline={data.heartbeats[0].bitrate_kbps?.toLocaleString() ?? "—"}
            hint={`last ${data.heartbeats.length} heartbeats`}
          >
            <AreaSpark
              values={[...data.heartbeats].reverse().map((hb) => hb.bitrate_kbps)}
              height={40}
            />
          </GraphTile>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-bold text-[clamp(1rem,1.3vw,1.25rem)] mb-3">
            Heartbeats <span className="dn-grad-text">({data.heartbeats.length})</span>
          </h2>
          <div className="dn-tile overflow-hidden max-h-96 overflow-y-auto">
            {data.heartbeats.length === 0 ? (
              <p className="text-sm text-[var(--dn-text-50)] p-4">No heartbeats recorded.</p>
            ) : (
              <table className="w-full text-xs font-mono">
                <tbody>
                  {data.heartbeats.map((hb, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.07)] last:border-0">
                      <td className="px-3 py-2">
                        <StatusBadge status={hb.status} />
                      </td>
                      <td className="px-3 py-2">{hb.fps?.toFixed(1) ?? "—"} fps</td>
                      <td className="px-3 py-2">{hb.bitrate_kbps ?? "—"} kbps</td>
                      <td className="px-3 py-2">
                        {hb.width && hb.height ? `${hb.width}×${hb.height}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-[var(--dn-text-50)]">
                        <RelativeTime value={hb.reported_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="font-bold text-[clamp(1rem,1.3vw,1.25rem)] mb-3">
              Validations <span className="dn-grad-text">({data.validations.length})</span>
            </h2>
            <div className="dn-tile p-4 space-y-3">
              {data.validations.length === 0 ? (
                <p className="text-sm text-[var(--dn-text-50)]">No validations recorded.</p>
              ) : (
                data.validations.map((v, i) => (
                  <div key={i} className="text-sm flex items-start gap-3">
                    <span
                      className={
                        v.passed ? "text-[var(--dn-creek-mid)] font-mono text-xs" : "text-[#e89e93] font-mono text-xs"
                      }
                    >
                      {v.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-[var(--dn-text-70)] font-mono text-xs">
                      {v.mismatch_fields.length > 0
                        ? `mismatch: ${v.mismatch_fields.join(", ")}`
                        : "all fields matched"}
                    </span>
                    <span className="ml-auto text-[var(--dn-text-50)] text-xs">
                      <RelativeTime value={v.created_at} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-bold text-[clamp(1rem,1.3vw,1.25rem)] mb-3">
              Processor <span className="dn-grad-text">status</span>
            </h2>
            <div className="dn-tile p-4 space-y-3">
              {data.processor_statuses.length === 0 ? (
                <p className="text-sm text-[var(--dn-text-50)]">No processor has attached.</p>
              ) : (
                data.processor_statuses.map((p) => (
                  <div key={p.processor_id} className="text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">{p.processor_id}</span>
                      <StatusBadge status={p.status} />
                      <span className="ml-auto text-[var(--dn-text-50)] text-xs">
                        <RelativeTime value={p.updated_at} />
                      </span>
                    </div>
                    <p className="text-xs text-[var(--dn-text-70)] font-mono mt-1">
                      in {p.fps_input ?? "—"} fps · processed {p.fps_processed ?? "—"} fps
                      {p.error_code ? ` · ${p.error_code}: ${p.error_message ?? ""}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-bold text-[clamp(1rem,1.3vw,1.25rem)] mb-3">
              Reliability <span className="dn-grad-text">findings</span>
            </h2>
            <div className="dn-tile p-4 space-y-3">
              {data.reliability_findings.length === 0 ? (
                <p className="text-sm text-[var(--dn-text-50)]">No findings for this camera.</p>
              ) : (
                data.reliability_findings.map((f, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={f.severity} />
                      <span className="font-medium">{f.title}</span>
                      <span className="ml-auto text-[var(--dn-text-50)] text-xs">
                        <RelativeTime value={f.last_seen_at} />
                      </span>
                    </div>
                    <p className="text-xs text-[var(--dn-text-70)] mt-1">{f.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
