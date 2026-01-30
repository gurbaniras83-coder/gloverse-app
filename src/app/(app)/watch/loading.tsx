
import { Skeleton } from "@/components/ui/skeleton";

export default function WatchPageSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="sticky top-0 z-10 aspect-video w-full" />
      <div className="p-4 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="p-3 rounded-lg bg-secondary space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
