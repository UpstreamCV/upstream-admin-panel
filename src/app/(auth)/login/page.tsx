import { safeNextPath } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <div className="dn-glass-card p-[clamp(1.75rem,3vw,2.75rem)]">
      <div className="mb-6 text-center">
        <p className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          upstream / admin
        </p>
        <h1 className="mt-2 font-bold text-[clamp(1.8rem,3.2vw,2.5rem)] leading-tight">
          Welcome <span className="dn-grad-text">back</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--dn-text-50)]">
          Platform admin access only. Accounts are allowlisted —{" "}
          there is no self-service signup.
        </p>
      </div>
      <LoginForm next={safeNext} />
    </div>
  );
}
