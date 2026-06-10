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
    <div className="glass rounded-3xl p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-accent mono">
          upstream / admin
        </p>
        <h1 className="display text-3xl font-semibold mt-2">
          Sign <em>in</em>
        </h1>
        <p className="text-sm text-ink-soft mt-2">
          Platform admin access only. Accounts are allowlisted —{" "}
          there is no self-service signup.
        </p>
      </div>
      <LoginForm next={safeNext} />
    </div>
  );
}
