
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  PlusSquare,
  Clapperboard,
  UserCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Flame },
  { href: "/upload", label: "Upload", icon: PlusSquare, isCentral: true },
  { href: "/subscriptions", label: "Subscriptions", icon: Clapperboard },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const profileHref = "/you";
  const [isCreateSheetOpen, setCreateSheetOpen] = React.useState(false);

  return (
    <nav className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 items-center justify-around">
        {navItems.map((item) => {
          if (item.isCentral) {
            return (
              <Sheet key={item.label} open={isCreateSheetOpen} onOpenChange={setCreateSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    )}
                  >
                    <item.icon className="h-7 w-7" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="w-full max-w-[500px] mx-auto rounded-t-xl border-none bg-secondary text-foreground p-4"
                >
                  <SheetHeader className="text-left mb-4">
                    <SheetTitle className="text-xl font-bold">Create</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-6">
                    <Link
                      href="/upload?type=short"
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted"
                      onClick={() => setCreateSheetOpen(false)}
                    >
                      <Flame className="w-7 h-7 text-primary" />
                      <span className="font-semibold text-lg">
                        Create a Short
                      </span>
                    </Link>
                    <Link
                      href="/upload"
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted"
                       onClick={() => setCreateSheetOpen(false)}
                    >
                      <Video className="w-7 h-7 text-primary" />
                      <span className="font-semibold text-lg">
                        Upload a video
                      </span>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary",
                { "text-primary": isActive }
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary",
            {
              "text-primary":
                pathname.startsWith(profileHref) || pathname.startsWith("/studio"),
            }
          )}
        >
          {user?.channel ? (
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={user.channel.photoURL}
                alt={user.channel.handle}
              />
              <AvatarFallback>
                {user.channel.handle.charAt(0).toUpperCase()}
              </AvatarFallback>
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
