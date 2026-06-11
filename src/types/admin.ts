// TypeScript mirrors of upstream-api-server's schemas/platform_admin.py.
// Source of truth: upstream-api-server/docs/api-contracts.md → "Endpoints —
// Platform admin".

export interface AdminMe {
  user_id: string;
  email: string | null;
}

// --- system health ---

export interface SystemHealth {
  api: { status: string; version: string; environment: string };
  database: { status: "ok" | "error"; latency_ms: number | null; error: string | null };
  streaming_server: {
    status: "ok" | "unreachable" | "error";
    active_paths: number | null;
    error: string | null;
  };
  processors: {
    active: number;
    stale: number;
    failed: number;
    latest_update_at: string | null;
  };
}

// --- streams ---

export interface AdminHeartbeat {
  status: string;
  fps: number | null;
  bitrate_kbps: number | null;
  width?: number | null;
  height?: number | null;
  codec?: string | null;
  last_error?: string | null;
  reported_at: string;
}

export interface AdminStreamItem {
  id: string;
  account_id: string;
  account_name: string;
  account_slug: string;
  agent_id: string;
  camera_id: string;
  camera_name: string | null;
  state: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  end_reason: string | null;
  failure_code: string | null;
  latest_heartbeat: AdminHeartbeat | null;
  latest_validation_passed: boolean | null;
  processor_status: string | null;
}

export interface AdminStreamList {
  items: AdminStreamItem[];
  total: number;
}

export interface AdminStreamsSummary {
  by_state: Record<string, number>;
  started_24h: number;
  validation_failures_24h: number;
  accounts_streaming: number;
  open_reliability_findings: number;
}

export interface AdminStreamDetail {
  session: AdminStreamItem;
  requested: Record<string, unknown>;
  approved: Record<string, unknown>;
  validated: Record<string, unknown>;
  heartbeats: AdminHeartbeat[];
  validations: {
    passed: boolean;
    observed: Record<string, unknown>;
    expected: Record<string, unknown>;
    mismatch_fields: string[];
    created_at: string;
  }[];
  reliability_findings: {
    finding_type: string;
    category: string;
    severity: string;
    status: string;
    title: string;
    message: string;
    last_seen_at: string;
  }[];
  processor_statuses: {
    processor_id: string;
    status: string;
    fps_input: number | null;
    fps_processed: number | null;
    last_frame_at: string | null;
    error_code: string | null;
    error_message: string | null;
    updated_at: string;
  }[];
}

// --- accounts ---

export interface AdminAccountItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  member_count: number;
  agent_count: number;
  camera_count: number;
  active_sessions: number;
}

export interface AdminAccountList {
  items: AdminAccountItem[];
  total: number;
}

export interface AdminAccountLimits {
  max_cameras: number;
  max_concurrent_sessions: number;
  max_fps: number;
  max_width: number;
  max_height: number;
  max_bitrate_kbps: number;
  allowed_codecs: string[];
  monthly_minutes_quota: number;
  snapshot_storage_mb: number;
  updated_at: string;
}

export interface AdminUsageTotal {
  event_type: string;
  unit: string;
  total_quantity: number;
}

export interface AdminAccountDetail {
  account: AdminAccountItem;
  limits: AdminAccountLimits | null;
  usage_30d: AdminUsageTotal[];
}

export interface AdminAccountMembers {
  members: {
    user_id: string;
    role: string;
    email: string | null;
    created_at: string;
  }[];
}

export interface AdminApiTokens {
  tokens: {
    id: string;
    name: string;
    prefix: string;
    last_four: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    created_at: string;
  }[];
}

// --- usage ---

export interface AdminUsageBuckets {
  buckets: {
    bucket_start: string;
    account_id: string;
    account_name: string;
    event_type: string;
    unit: string;
    total_quantity: number;
  }[];
}

export interface AdminUsageSummary {
  days: number;
  rows: {
    account_id: string;
    account_name: string;
    account_slug: string;
    plan: string;
    event_type: string;
    unit: string;
    total_quantity: number;
  }[];
}

export interface AdminApiTokenCreateResponse {
  token: AdminApiTokens["tokens"][number];
  plaintext: string;
}

export interface AdminRecoveryLink {
  email: string;
  action_link: string;
}

// --- platform admins ---

export interface AdminPlatformAdmins {
  admins: {
    user_id: string;
    email: string | null;
    note: string | null;
    created_at: string;
  }[];
}

// --- audit log ---

export interface AdminAuditLog {
  items: {
    id: string;
    admin_user_id: string;
    action: string;
    target_type: string;
    target_id: string | null;
    payload: { before?: Record<string, unknown>; after?: Record<string, unknown> };
    request_id: string | null;
    created_at: string;
  }[];
  total: number;
}
