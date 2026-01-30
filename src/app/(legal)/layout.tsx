import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalPagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 flex h-14 flex-shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/you">
            <ChevronLeft />
            <span className="sr-only">Back to profile</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">GloVerse Info</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
