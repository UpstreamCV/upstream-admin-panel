// Hand-rolled SVG micro-charts in the dn-tile aesthetic — deliberately no
// charting library (the panel's standing decision). Both render nothing
// meaningful for empty input and scale to their container via viewBox.

const GOLD = "#d9a441";

/** Filled line chart. `values` may contain nulls (gaps are skipped — the
 * line breaks rather than lying through an interpolated dip to zero). */
export function AreaSpark({
  values,
  color = GOLD,
  height = 48,
}: {
  values: (number | null)[];
  color?: string;
  height?: number;
}) {
  const width = 100;
  // Treat anything non-finite (undefined from an older API, NaN from a bad
  // sum) as a gap — one poisoned point must not blank the whole chart.
  const cleaned = values.map((v) =>
    typeof v === "number" && Number.isFinite(v) ? v : null,
  );
  const nums = cleaned.filter((v): v is number => v !== null);
  if (cleaned.length < 2 || nums.length === 0) {
    return <EmptySpark height={height} />;
  }
  const max = Math.max(...nums, 1e-9);
  const min = Math.min(...nums, 0);
  const range = max - min || 1;
  const x = (i: number) => (i / (cleaned.length - 1)) * width;
  const y = (v: number) => 4 + (1 - (v - min) / range) * (height - 8);

  // Split into contiguous non-null segments so gaps stay gaps.
  const segments: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  cleaned.forEach((v, i) => {
    if (v === null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push({ i, v });
    }
  });
  if (current.length) segments.push(current);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden
    >
      {segments.map((seg, sIdx) => {
        const line = seg.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
        const area =
          `${x(seg[0].i)},${height} ` + line + ` ${x(seg[seg.length - 1].i)},${height}`;
        return (
          <g key={sIdx}>
            <polygon points={area} fill={color} opacity={0.18} />
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Tiny bar chart for counts. Zero-value bars render a 1px stub so the time
 * axis stays legible. */
export function BarSpark({
  values,
  color = GOLD,
  height = 48,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const width = 100;
  if (values.length === 0) return <EmptySpark height={height} />;
  // Same posture as AreaSpark: non-finite input renders as an empty slot.
  const cleaned = values.map((v) => (Number.isFinite(v) ? v : 0));
  const max = Math.max(...cleaned, 1);
  const slot = width / cleaned.length;
  const barWidth = Math.max(slot * 0.6, 0.5);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden
    >
      {cleaned.map((v, i) => {
        const barHeight = v === 0 ? 1 : Math.max((v / max) * (height - 6), 1.5);
        return (
          <rect
            key={i}
            x={i * slot + (slot - barWidth) / 2}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={0.75}
            fill={color}
            opacity={v === 0 ? 0.25 : 0.85}
          />
        );
      })}
    </svg>
  );
}

function EmptySpark({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded bg-white/[0.04] grid place-items-center text-[10px] text-[var(--dn-text-50)]"
      style={{ height }}
    >
      no data
    </div>
  );
}

/** Graph tile: headline value + label + a spark underneath. */
export function GraphTile({
  label,
  headline,
  hint,
  children,
}: {
  label: string;
  headline: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="dn-tile flex flex-col gap-2 p-[clamp(0.9rem,1.6vw,1.4rem)] min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          {label}
        </span>
        {hint ? (
          <span className="text-[clamp(0.65rem,0.8vw,0.8rem)] text-[var(--dn-text-50)]">
            {hint}
          </span>
        ) : null}
      </div>
      <span className="font-bold leading-none text-[clamp(1.4rem,2.8vw,2.1rem)]">
        {headline}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Uptime strip: one cell per sample, colored by status. */
export function UptimeStrip({
  statuses,
  height = 20,
}: {
  statuses: ("ok" | "warn" | "down")[];
  height?: number;
}) {
  const width = 100;
  if (statuses.length === 0) return <EmptySpark height={height} />;
  const slot = width / statuses.length;
  const color = { ok: GOLD, warn: "#eedc68", down: "#e15a4c" } as const;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden
    >
      {statuses.map((s, i) => (
        <rect
          key={i}
          x={i * slot + slot * 0.15}
          y={2}
          width={slot * 0.7}
          height={height - 4}
          rx={1}
          fill={color[s]}
          opacity={s === "ok" ? 0.55 : 0.95}
        />
      ))}
    </svg>
  );
}
