"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VerifiedBadge = ({ className }: { className?: string }) => {
  return (
    <Star
      className={cn(
        'w-4 h-4 flex-shrink-0 text-yellow-400 fill-yellow-400 shadow-[0_0_10px_#FFD700]',
        className
      )}
      aria-label="Verified creator"
    />
  );
};
