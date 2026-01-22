"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ scale: [1, 1.03, 1], opacity: [1, 0.9, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center justify-center"
      >
        <Image src="/logo.png" alt="Gloverse Logo" width={256} height={256} className="w-48 h-48 object-contain" priority />
      </motion.div>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-white/80 tracking-wider">
          GloVerse - Unleash Your Inner Star
        </p>
      </div>
    </div>
  );
}
