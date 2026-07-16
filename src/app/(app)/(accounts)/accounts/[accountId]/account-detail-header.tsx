"use client";

import Link from "next/link";
import { CopyButton } from "@/components/data/copy-button";
import { PageHeader } from "@/components/data/page-header";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountDetail } from "@/types/admin";

// Persistent account header — rendered by the detail layout so it stays visible
// across the Plan/Usage/Members/Limits/Tokens tabs. Fetches the same detail
// endpoint the Plan/Usage/Limits tabs use; SWR dedupes the shared key.
export function AccountDetailHeader({ accountId }: { accountId: string }) {
  const { data } = useUpstreamList<AdminAccountDetail>(
    `/v1/admin/accounts/${accountId}`,
    { refreshInterval: 30_000 },
  );
  const account = data?.account;

  return (
    <PageHeader
      eyebrow="account"
      title={account?.name ?? "Account"}
      accent={account ? `/${account.slug}` : ""}
      description={
        <span className="font-mono text-xs flex items-center gap-1">
          {account?.id ?? accountId} <CopyButton value={account?.id ?? accountId} />
        </span>
      }
      actions={
        account ? (
          <Link
            href={`/streams?account=${account.id}`}
            className="text-sm text-[var(--dn-creek-mid)] hover:underline"
          >
            View streams →
          </Link>
        ) : undefined
      }
    />
  );
}
