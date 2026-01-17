"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  PlusSquare,
  Clapperboard,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Flame },
  { href: "/upload", label: "Upload", icon: PlusSquare, isCentral: true },
  { href: "/subscriptions", label: "Subscriptions", icon: Clapperboard },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  // The 'You' tab should always link to /you page per user request to fix 404.
  const profileHref = "/you";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[500px] items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary",
                { "text-primary": isActive },
                item.isCentral &&
                  "h-12 w-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <item.icon
                className={cn("h-6 w-6", item.isCentral && "h-7 w-7")}
              />
              {!item.isCentral && (
                <span className="text-[10px] font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary",
            // The 'You' page includes the profile view, studio, and settings, so highlight for /you or /studio.
            { "text-primary": pathname.startsWith("/you") || pathname.startsWith("/studio") }
          )}
        >
          {user?.channel ? (
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.channel.photoURL} alt={user.channel.handle} />
              <AvatarFallback>{user.channel.handle.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="h-6 w-6" />
          )}
          <span className="text-[10px] font-medium">You</span>
        </Link>
      </div>
    </nav>
  );
}
