import { AccountUsageClient } from "./usage-client";

// /accounts/[accountId]/usage — the Usage tab.
export default async function AccountUsagePage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountUsageClient accountId={accountId} />;
}
