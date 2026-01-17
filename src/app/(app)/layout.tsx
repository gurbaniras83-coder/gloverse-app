import { BottomNav } from "@/components/layout/bottom-nav";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[500px] flex-col bg-background">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
