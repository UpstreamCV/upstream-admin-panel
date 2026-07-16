import { SystemOverviewClient } from "./overview-client";

// System · Overview — resolves to "/" (the (system) route group adds no URL
// segment). This is also the scrolling Home (see AppShell); the System
// SectionTabs strip is rendered by (system)/layout.tsx above this content.
export default function SystemPage() {
  return <SystemOverviewClient />;
}
