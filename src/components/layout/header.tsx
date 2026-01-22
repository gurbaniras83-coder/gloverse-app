"use client";

import { Logo } from "@/components/ui/logo";
import { Bell, Cast, UserCircle } from "lucide-react";
import { SearchDialog } from "@/components/search-dialog";
import { useAuth } from "@/context/auth-provider";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur-sm">
      <Logo />
      <div className="flex items-center gap-1">
        <SearchDialog />
        <button className="p-2 hidden sm:inline-block" aria-label="Cast">
          <Cast className="w-6 h-6 text-muted-foreground" />
        </button>
        <button className="p-2" aria-label="Notifications">
          <Bell className="w-6 h-6 text-muted-foreground" />
        </button>
        <Link href="/you" className="p-2" aria-label="Your profile">
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
                <UserCircle className="h-6 w-6 text-muted-foreground" />
            )}
        </Link>
      </div>
    </header>
  );
}
