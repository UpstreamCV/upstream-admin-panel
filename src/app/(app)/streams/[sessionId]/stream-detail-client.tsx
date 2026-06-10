"use client";

import Link from "next/link";
import { CopyButton } from "@/components/data/copy-button";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamDetail } from "@/types/admin";

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
    <div className="glass rounded-2xl px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">{title}</p>
      {empty ? (
        <p className="text-sm text-ink-mute mt-2">—</p>
      ) : (
        <dl className="mt-2 space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="mono">{v === null || v === undefined ? "—" : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function StreamDetailClient({ sessionId }: { sessionId: string }) {
  const { data, error } = useUpstreamList<AdminStreamDetail>(
    `/v1/admin/streams/${sessionId}`,
    { refreshInterval: 10_000 },
  );

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-ink-soft">Session not found.</p>
        <Link href="/streams" className="text-accent hover:underline text-sm">
          ← Back to streams
        </Link>
      </div>
    );
  }
  if (!data) {
    return <p className="text-ink-mute text-sm">Loading…</p>;
  }

  const s = data.session;

  return (
    <div>
      <PageHeader
        eyebrow={`${s.account_name} /${s.account_slug}`}
        title="Session"
        accent={s.camera_name ?? "detail"}
        description={
          <span className="mono text-xs flex items-center gap-1">
            {s.id} <CopyButton value={s.id} />
          </span>
        }
        actions={<StatusBadge status={s.state} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-2xl px-5 py-4 text-sm space-y-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">
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
          {s.end_reason ? <p className="mono text-xs">reason: {s.end_reason}</p> : null}
          {s.failure_code ? (
            <p className="mono text-xs text-[#e89e93]">failure: {s.failure_code}</p>
          ) : null}
        </div>
        <SpecCard title="Requested" spec={data.requested} />
        <SpecCard title="Approved" spec={data.approved} />
        <SpecCard title="Validated (ffprobe)" spec={data.validated} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="display text-lg font-semibold mb-3">
            Heartbeats <em>({data.heartbeats.length})</em>
          </h2>
          <div className="glass rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
            {data.heartbeats.length === 0 ? (
              <p className="text-sm text-ink-mute p-4">No heartbeats recorded.</p>
            ) : (
              <table className="w-full text-xs mono">
                <tbody>
                  {data.heartbeats.map((hb, i) => (
                    <tr key={i} className="border-b border-glass-stroke-2/60 last:border-0">
                      <td className="px-3 py-2">
                        <StatusBadge status={hb.status} />
                      </td>
                      <td className="px-3 py-2">{hb.fps?.toFixed(1) ?? "—"} fps</td>
                      <td className="px-3 py-2">{hb.bitrate_kbps ?? "—"} kbps</td>
                      <td className="px-3 py-2">
                        {hb.width && hb.height ? `${hb.width}×${hb.height}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-ink-mute">
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
            <h2 className="display text-lg font-semibold mb-3">
              Validations <em>({data.validations.length})</em>
            </h2>
            <div className="glass rounded-2xl p-4 space-y-3">
              {data.validations.length === 0 ? (
                <p className="text-sm text-ink-mute">No validations recorded.</p>
              ) : (
                data.validations.map((v, i) => (
                  <div key={i} className="text-sm flex items-start gap-3">
                    <span
                      className={
                        v.passed ? "text-accent mono text-xs" : "text-[#e89e93] mono text-xs"
                      }
                    >
                      {v.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-ink-soft mono text-xs">
                      {v.mismatch_fields.length > 0
                        ? `mismatch: ${v.mismatch_fields.join(", ")}`
                        : "all fields matched"}
                    </span>
                    <span className="ml-auto text-ink-mute text-xs">
                      <RelativeTime value={v.created_at} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="display text-lg font-semibold mb-3">
              Processor <em>status</em>
            </h2>
            <div className="glass rounded-2xl p-4 space-y-3">
              {data.processor_statuses.length === 0 ? (
                <p className="text-sm text-ink-mute">No processor has attached.</p>
              ) : (
                data.processor_statuses.map((p) => (
                  <div key={p.processor_id} className="text-sm">
                    <div className="flex items-center gap-3">
                      <span className="mono text-xs">{p.processor_id}</span>
                      <StatusBadge status={p.status} />
                      <span className="ml-auto text-ink-mute text-xs">
                        <RelativeTime value={p.updated_at} />
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft mono mt-1">
                      in {p.fps_input ?? "—"} fps · processed {p.fps_processed ?? "—"} fps
                      {p.error_code ? ` · ${p.error_code}: ${p.error_message ?? ""}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="display text-lg font-semibold mb-3">
              Reliability <em>findings</em>
            </h2>
            <div className="glass rounded-2xl p-4 space-y-3">
              {data.reliability_findings.length === 0 ? (
                <p className="text-sm text-ink-mute">No findings for this camera.</p>
              ) : (
                data.reliability_findings.map((f, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={f.severity} />
                      <span className="font-medium">{f.title}</span>
                      <span className="ml-auto text-ink-mute text-xs">
                        <RelativeTime value={f.last_seen_at} />
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft mt-1">{f.message}</p>
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
