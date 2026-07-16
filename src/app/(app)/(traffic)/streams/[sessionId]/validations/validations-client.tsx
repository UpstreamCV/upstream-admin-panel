"use client";

import { RelativeTime } from "@/components/data/relative-time";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamDetail } from "@/types/admin";

// Stream detail · Validations — the ffprobe validation attempts for this session.
export function StreamValidationsClient({ sessionId }: { sessionId: string }) {
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
                  v.passed
                    ? "text-[var(--dn-creek-mid)] font-mono text-xs"
                    : "text-[#e89e93] font-mono text-xs"
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
  );
}
