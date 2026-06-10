import { StreamDetailClient } from "./stream-detail-client";

export default async function StreamDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StreamDetailClient sessionId={sessionId} />;
}
