import { Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Flame className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-foreground">
        Gloverse
      </h1>
    </Link>
  );
}
