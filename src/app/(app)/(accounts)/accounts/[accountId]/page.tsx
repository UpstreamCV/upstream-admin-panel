import { AccountPlanClient } from "./plan-client";

// /accounts/[accountId] — the Plan tab of an account. Header + tabs live in this
// segment's layout.tsx.
export default async function AccountPlanPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountPlanClient accountId={accountId} />;
}
