"use client";

import { MembersCard } from "../manage-cards";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountMembers } from "@/types/admin";

// Account detail · Members — add / role / remove members + recovery links.
export function AccountMembersClient({ accountId }: { accountId: string }) {
  const { data, error, mutate } = useUpstreamList<AdminAccountMembers>(
    `/v1/admin/accounts/${accountId}/members`,
    { refreshInterval: 60_000 },
  );

  if (error) {
    return <p className="text-sm text-[var(--dn-text-50)]">Account not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <MembersCard accountId={accountId} members={data} onChanged={() => void mutate()} />
    </div>
  );
}
