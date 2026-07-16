"use client";

import { TokensCard } from "../manage-cards";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminApiTokens } from "@/types/admin";

// Account detail · Tokens — issue / revoke this account's API tokens.
export function AccountTokensClient({ accountId }: { accountId: string }) {
  const { data, error, mutate } = useUpstreamList<AdminApiTokens>(
    `/v1/admin/accounts/${accountId}/api-tokens`,
    { refreshInterval: 60_000 },
  );

  if (error) {
    return <p className="text-sm text-[var(--dn-text-50)]">Account not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <TokensCard accountId={accountId} tokens={data} onChanged={() => void mutate()} />
    </div>
  );
}
