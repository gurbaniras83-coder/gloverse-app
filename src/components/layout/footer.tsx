
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn(
      "w-full bg-background border-t border-border p-4 text-center text-xs text-muted-foreground",
      className
    )}>
      <div className="flex justify-center items-center gap-4 md:gap-6 mb-3">
        <Link href="/about" className="hover:text-primary transition-colors">About</Link>
        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
        <a href="/app-ads.txt" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">app-ads.txt</a>
      </div>
      <p className="text-muted-foreground/60">&copy; {new Date().getFullYear()} GloVerse. All rights reserved.</p>
    </footer>
  );
}
