import { ShellBackdrop } from "@/components/chrome/shell-backdrop";

// Skeleton shell shown while the (app) layout's /v1/admin/me gate and the
// first page payload resolve — mirrors the dashboard's loading.tsx.
export default function Loading() {
  return (
    <div className="dn-shell-bg relative min-h-dvh overflow-hidden p-3 md:p-5">
      <ShellBackdrop />
      <div className="relative z-10">
        <div className="h-10 w-64 rounded-full bg-white/10 animate-pulse" />
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="dn-tile h-[clamp(140px,18vw,220px)] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
