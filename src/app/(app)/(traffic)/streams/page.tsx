import { Suspense } from "react";
import { StreamsClient } from "./streams-client";

export default function StreamsPage() {
  // Suspense: StreamsClient reads useSearchParams (the ?account= filter from
  // an account detail page), which Next requires to be wrapped for prerender.
  return (
    <Suspense>
      <StreamsClient />
    </Suspense>
  );
}
