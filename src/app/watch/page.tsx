import { Suspense } from "react";
import WatchPageContent, { WatchPageSkeleton } from "./client";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function WatchPage() {
  return (
    <Suspense fallback={<WatchPageSkeleton />}>
      <WatchPageContent />
    </Suspense>
  );
}
