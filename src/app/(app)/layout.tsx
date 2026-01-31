"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { ProfileCompletionDialog } from "@/components/profile-completion-dialog";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // For shorts, we have a custom layout with a footer but no header/nav
  if (pathname.startsWith('/shorts')) {
    return (
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[500px] flex-col bg-black">
        <main className="flex-1 overflow-hidden">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[500px] flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {children}
        <Footer />
      </main>
      <BottomNav />
      <ProfileCompletionDialog />
    </div>
  );
}
