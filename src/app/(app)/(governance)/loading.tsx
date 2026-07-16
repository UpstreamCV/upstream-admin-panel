import { SectionContentSkeleton } from "@/components/data/section-content-skeleton";

// Content-only suspense fallback for this section. Sits BELOW the group
// layout, so the SectionTabs strip persists while only the content reloads.
export default function Loading() {
  return <SectionContentSkeleton />;
}
