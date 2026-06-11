"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { reportError } from "@/lib/error";

// Error boundary for the authed shell — mirrors the dashboard's error.tsx.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { area: "admin-panel" });
  }, [error]);

  return (
    <div className="dn-shell-bg min-h-dvh grid place-items-center p-6">
      <div className="dn-tile w-full max-w-md text-center p-8">
        <AlertTriangle className="mx-auto h-7 w-7 text-[#e15a4c]" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Something broke</h2>
        <p className="mt-2 text-sm text-[var(--dn-text-50)]">{error.message}</p>
        {error.digest ? (
          <p className="mt-1 text-[11px] text-[var(--dn-text-50)] font-mono">
            {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="dn-grad-btn mt-5 px-5 py-2 text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
