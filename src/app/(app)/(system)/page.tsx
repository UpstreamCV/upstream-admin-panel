import { SystemHealthClient } from "./system-health-client";

// System — resolves to "/" (the (system) route group adds no URL segment) and
// is the scrolling Home (see AppShell). Everything on one page, no tabs; the
// (system) group has no layout.tsx, so — like the dashboard's (home) group — it
// gets a tab-less loading boundary distinct from the tabbed sections.
export default function SystemPage() {
  return <SystemHealthClient />;
}
