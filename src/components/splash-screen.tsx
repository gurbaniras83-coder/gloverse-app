"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 3000); // 3-second duration

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-[#0f0f0f]">
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center justify-center"
      >
        <Star className="h-24 w-24 text-primary" fill="currentColor" />
      </motion.div>
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Gloverse
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Unleash Your Inner Star</p>
      </div>
    </div>
  );
}
