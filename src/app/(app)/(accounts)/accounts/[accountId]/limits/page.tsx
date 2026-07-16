import { AccountLimitsClient } from "./limits-client";

// /accounts/[accountId]/limits — the Limits tab.
export default async function AccountLimitsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountLimitsClient accountId={accountId} />;
}
