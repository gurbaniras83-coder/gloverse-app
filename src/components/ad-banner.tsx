
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";

export function AdBanner({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex h-14 w-full items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground",
      className
    )}>
      <DollarSign className="w-4 h-4 mr-2" />
      <p>Advertisement</p>
    </div>
  );
}
