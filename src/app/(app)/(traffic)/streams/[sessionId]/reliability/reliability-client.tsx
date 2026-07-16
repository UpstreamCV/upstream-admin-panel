"use client";

import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamDetail } from "@/types/admin";

// Stream detail · Reliability — open reliability findings for this camera.
export function StreamReliabilityClient({ sessionId }: { sessionId: string }) {
  const { data, error } = useUpstreamList<AdminStreamDetail>(
    `/v1/admin/streams/${sessionId}`,
    { refreshInterval: 10_000 },
  );

  if (error) {
    return <p className="text-sm text-[var(--dn-text-50)]">Session not found.</p>;
  }
  if (!data) {
    return <p className="text-[var(--dn-text-50)] text-sm">Loading…</p>;
  }

  return (
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
  );
}
