import { SectionContentSkeleton } from "@/components/data/section-content-skeleton";

// Per-tab suspense fallback — sits below the detail layout, so the header + tab
// strip persist while a tab's content loads.
export default function Loading() {
  return <SectionContentSkeleton />;
}
