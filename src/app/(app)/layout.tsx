"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { ProfileCompletionDialog } from "@/components/profile-completion-dialog";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // For shorts, we want a full-screen experience without header/nav
  if (pathname.startsWith('/shorts')) {
    return (
      <div className="relative mx-auto h-[100dvh] w-full max-w-[500px] bg-black">
        {/* The shorts page will fill this container */}
        {children}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[500px] flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      <BottomNav />
      <ProfileCompletionDialog />
    </div>
  );
}
