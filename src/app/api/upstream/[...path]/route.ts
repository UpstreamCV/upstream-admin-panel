import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "cookie",
  "authorization",
]);

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  // Reject path-traversal segments before URL parsing normalizes them away.
  for (const segment of path) {
    if (segment === "" || segment === "." || segment === "..") {
      return NextResponse.json(
        { error: { code: "invalid_path", message: "Invalid request path." } },
        { status: 400 },
      );
    }
  }

  // This proxy serves ONLY the platform-admin surface. Forwarding anything
  // else would let it be used as a generic authenticated tunnel to tenant
  // endpoints, which is the dashboard's job, not the admin panel's.
  if (path[0] !== "v1" || path[1] !== "admin") {
    return NextResponse.json(
      { error: { code: "invalid_path", message: "Only /v1/admin/* is proxied." } },
      { status: 404 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "missing_credentials", message: "Not signed in." } },
      { status: 401 },
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "invalid_user_token", message: "No access token." } },
      { status: 401 },
    );
  }

  const upstreamUrl = new URL(req.url);
  const targetPath = "/" + path.map(encodeURIComponent).join("/");
  const target = new URL(
    targetPath + upstreamUrl.search,
    env.NEXT_PUBLIC_UPSTREAM_API_URL,
  );

  const headers = new Headers();
  for (const [k, v] of req.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) headers.set(k, v);
  }
  headers.set("Authorization", `Bearer ${accessToken}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(target.toString(), init);
  } catch (err) {
    reportError(err, { area: "upstream_proxy", path: targetPath });
    return NextResponse.json(
      {
        error: {
          code: "upstream_unreachable",
          message: "Could not reach the Upstream API.",
          details: { reason: err instanceof Error ? err.message : String(err) },
        },
      },
      { status: 502 },
    );
  }

  // Pipe response through. 403 not_platform_admin passes through untouched —
  // the client renders the not-authorized state rather than redirecting.
  const responseHeaders = new Headers();
  for (const [k, v] of upstreamResponse.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) responseHeaders.set(k, v);
  }
  // Bodyless statuses (DELETE -> 204 etc.): the Response constructor throws
  // on a body — even an empty ArrayBuffer — with these codes.
  if ([204, 205, 304].includes(upstreamResponse.status)) {
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }
  const buf = await upstreamResponse.arrayBuffer();
  return new NextResponse(buf, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
