"use client";

import { Logo } from "@/components/ui/logo";
import { Bell, Cast } from "lucide-react";
import { SearchDialog } from "@/components/search-dialog";

export function Header() {
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
      </div>
    </header>
  );
}
