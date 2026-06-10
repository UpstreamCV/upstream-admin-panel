"use client";

import { type SWRConfiguration } from "swr";
import { reportError } from "@/lib/error";
import { UpstreamApiError, type ApiErrorEnvelope } from "./errors";

export const PROXY_BASE = "/api/upstream";

export class ProxyAuthExpired extends Error {
  constructor() {
    super("Session expired");
    this.name = "ProxyAuthExpired";
  }
}

/**
 * Browser-side fetcher. Goes through the `/api/upstream` Next route handler
 * so the Supabase access token never leaves the server.
 *
 * On 401 from the proxy, throws ProxyAuthExpired. Callers wrap with SWR's
 * `onError` which redirects to /login. 403 not_platform_admin surfaces as an
 * UpstreamApiError — the (app) layout already gates rendering on /v1/admin/me,
 * so a 403 here means access was revoked mid-session.
 */
export async function proxyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("/") ? `${PROXY_BASE}${path}` : `${PROXY_BASE}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (res.status === 401) {
    throw new ProxyAuthExpired();
  }
  if (!res.ok) {
    const envelope =
      (parsed as ApiErrorEnvelope | null) ??
      ({
        error: {
          code: "internal_error",
          message: res.statusText || "Request failed.",
        },
      } satisfies ApiErrorEnvelope);
    throw new UpstreamApiError(res.status, envelope);
  }
  return parsed as T;
}

/**
 * Default SWR options for the panel. Visibility-aware polling, no refetch on
 * hidden tabs, conservative dedupe.
 */
export const defaultSwrConfig: SWRConfiguration = {
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  revalidateOnFocus: true,
  dedupingInterval: 3000,
  keepPreviousData: true,
  shouldRetryOnError: (err) => {
    if (err instanceof ProxyAuthExpired) return false;
    if (err instanceof UpstreamApiError && (err.status === 404 || err.status === 403)) {
      return false;
    }
    return true;
  },
  onError: (err) => {
    if (err instanceof ProxyAuthExpired) {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    if (err instanceof UpstreamApiError && err.status === 404) return;
    reportError(err, { area: "swr" });
  },
};
