import { StreamOverviewClient } from "./overview-client";

// /streams/[sessionId] — the Overview tab of a stream session. Header + tabs
// live in this segment's layout.tsx.
export default async function StreamOverviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StreamOverviewClient sessionId={sessionId} />;
}
