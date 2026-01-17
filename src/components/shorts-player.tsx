"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "@/lib/types";
import { mockShorts } from "@/lib/mock-data";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send, Plus, Volume2, VolumeX } from "lucide-react";

interface ShortCardProps {
  short: Video;
  isIntersecting: boolean;
}

function ShortCard({ short, isIntersecting }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (isIntersecting) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
      videoRef.current?.currentTime && (videoRef.current.currentTime = 0);
    }
  }, [isIntersecting]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }

  return (
    <div className="relative h-full w-full snap-start overflow-hidden">
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        muted={isMuted}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

      <div className="absolute bottom-4 left-4 text-white">
        <Link href={`/@${short.channel.handle}`} className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={short.channel.photoURL} />
            <AvatarFallback>{short.channel.handle[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{short.channel.handle}</span>
        </Link>
        <p className="mt-2 text-sm">{short.title}</p>
      </div>
      
      <div className="absolute bottom-4 right-2 flex flex-col items-center gap-4 text-white">
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white">
          <Heart className="h-8 w-8" />
          <span className="text-xs">1.2M</span>
        </Button>
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white">
          <MessageCircle className="h-8 w-8" />
          <span className="text-xs">5,123</span>
        </Button>
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white">
          <Send className="h-8 w-8" />
          <span className="text-xs">Share</span>
        </Button>
        <button onClick={toggleMute} className="mt-2">
          {isMuted ? <VolumeX className="h-6 w-6"/> : <Volume2 className="h-6 w-6"/>}
        </button>
      </div>
    </div>
  );
}

export function ShortsPlayer() {
  const shorts = mockShorts;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleShortId, setVisibleShortId] = useState<string | null>(shorts.length > 0 ? shorts[0].id : null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleShortId(entry.target.getAttribute("data-short-id"));
          }
        });
      },
      { threshold: 0.5 } // 50% of the item must be visible
    );

    const shortsElements = containerRef.current?.querySelectorAll("[data-short-id]");
    shortsElements?.forEach((el) => observer.observe(el));

    return () => {
      shortsElements?.forEach((el) => observer.unobserve(el));
    };
  }, [shorts]);

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-4rem)] w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar"
    >
      {shorts.map((short) => (
        <div key={short.id} data-short-id={short.id} className="h-full w-full snap-start">
            <ShortCard short={short} isIntersecting={visibleShortId === short.id} />
        </div>
      ))}
    </div>
  );
}
