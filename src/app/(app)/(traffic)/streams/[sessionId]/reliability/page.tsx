import { StreamReliabilityClient } from "./reliability-client";

// /streams/[sessionId]/reliability — the Reliability tab.
export default async function StreamReliabilityPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StreamReliabilityClient sessionId={sessionId} />;
}
