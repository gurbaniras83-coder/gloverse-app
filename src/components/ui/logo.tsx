import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="Gloverse Logo"
        width={128}
        height={36}
        className="h-9 w-auto"
        priority
      />
    </Link>
  );
}
