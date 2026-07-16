import { StreamValidationsClient } from "./validations-client";

// /streams/[sessionId]/validations — the Validations tab.
export default async function StreamValidationsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StreamValidationsClient sessionId={sessionId} />;
}
