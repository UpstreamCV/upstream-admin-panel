import { AccountTokensClient } from "./tokens-client";

// /accounts/[accountId]/tokens — the Tokens tab.
export default async function AccountTokensPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountTokensClient accountId={accountId} />;
}
