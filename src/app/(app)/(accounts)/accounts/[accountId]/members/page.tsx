import { AccountMembersClient } from "./members-client";

// /accounts/[accountId]/members — the Members tab.
export default async function AccountMembersPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountMembersClient accountId={accountId} />;
}
