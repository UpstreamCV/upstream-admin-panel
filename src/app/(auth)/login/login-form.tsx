"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type LoginState } from "./actions";

// Submit button with the dashboard login's cursor-proximity glow: pointer
// position feeds --mx/--my, distance-to-edge feeds --glow (1 over → 0 at
// RANGE px away). Same mechanics as login-form-next.tsx in the dashboard.
function SubmitButton() {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const RANGE = 240;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      el.style.setProperty(
        "--glow",
        Math.max(0, 1 - Math.hypot(dx, dy) / RANGE).toFixed(3),
      );
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <button
      ref={ref}
      type="submit"
      disabled={pending}
      className="dn-grad-btn dn-glow-btn w-full py-3.5 font-bold text-[clamp(0.95rem,1.1vw,1.05rem)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="relative z-10">
        {pending ? "Signing in…" : "Sign in"}
      </span>
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState | undefined, FormData>(
    signInAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)] pl-4"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="dn-field w-full px-6 py-3.5 text-[clamp(0.95rem,1.1vw,1.05rem)]"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)] pl-4"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="dn-field w-full px-6 py-3.5 text-[clamp(0.95rem,1.1vw,1.05rem)]"
        />
      </div>
      {state?.error ? (
        <p className="rounded-2xl bg-[rgba(225,90,76,0.18)] border border-[rgba(225,90,76,0.45)] px-4 py-2.5 text-sm text-[#ffd9d2]">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
