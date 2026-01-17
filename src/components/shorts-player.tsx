"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "@/lib/types";
import { mockShorts } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import type { Channel } from "@/lib/types";

interface ShortCardProps {
  short: Video;
  isIntersecting: boolean;
}

function ShortCard({ short, isIntersecting }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isIntersecting) {
      // Auto-play when it comes into view
      videoRef.current?.play().then(() => setIsPlaying(true)).catch(error => console.error("Video play failed:", error));
    } else {
      // Pause and reset when it goes out of view
      videoRef.current?.pause();
      setIsPlaying(false);
      if(videoRef.current?.currentTime) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [isIntersecting]);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current?.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling play/pause
    setIsMuted(prev => !prev);
  }

  if (!short.channel) return null;

  return (
    <div className="relative h-full w-full snap-start overflow-hidden bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="h-16 w-16 text-white/70" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

      <div className="absolute bottom-4 left-4 text-white">
        <Link href={`/@${short.channel.handle}`} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={short.channel.photoURL} />
            <AvatarFallback>{short.channel.handle[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{short.channel.handle}</span>
        </Link>
        <p className="mt-2 text-sm">{short.title}</p>
      </div>
      
      <div className="absolute bottom-4 right-2 flex flex-col items-center gap-4 text-white">
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={e => e.stopPropagation()}>
          <Heart className="h-8 w-8" />
          <span className="text-xs">1.2M</span>
        </Button>
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={e => e.stopPropagation()}>
          <MessageCircle className="h-8 w-8" />
          <span className="text-xs">5,123</span>
        </Button>
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={e => e.stopPropagation()}>
          <Send className="h-8 w-8" />
          <span className="text-xs">Share</span>
        </Button>
        <button onClick={toggleMute} className="mt-2 text-white">
          {isMuted ? <VolumeX className="h-6 w-6"/> : <Volume2 className="h-6 w-6"/>}
        </button>
      </div>
    </div>
  );
}

export function ShortsPlayer() {
  const [shorts, setShorts] = useState<Video[]>(mockShorts);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleShortId, setVisibleShortId] = useState<string | null>(null);

  useEffect(() => {
    const fetchShorts = async () => {
      setLoading(true);
      try {
        const shortsQuery = query(
          collection(db, "videos"), 
          where("type", "==", "short"), 
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );
        const shortsSnapshot = await getDocs(shortsQuery);

        let fetchedShorts: Video[] = [];
        if (!shortsSnapshot.empty) {
            fetchedShorts = await Promise.all(shortsSnapshot.docs.map(async (videoDoc) => {
                const videoData = videoDoc.data();
                const channelRef = doc(db, "channels", videoData.channelId);
                const channelSnap = await getDoc(channelRef);
                const channelData = channelSnap.exists() ? { ...channelSnap.data(), id: channelSnap.id } as Channel : null;
                return {
                    id: videoDoc.id,
                    ...videoData,
                    createdAt: videoData.createdAt.toDate(),
                    channel: channelData,
                } as Video;
            }));
            fetchedShorts = fetchedShorts.filter(v => v.channel);
        }
        
        setShorts(fetchedShorts.length > 0 ? fetchedShorts : mockShorts);

      } catch (error) {
        console.error("Error fetching shorts, falling back to mocks:", error);
        setShorts(mockShorts);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  useEffect(() => {
    if (loading || shorts.length === 0) return;
    
    setVisibleShortId(shorts[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleShortId(entry.target.getAttribute("data-short-id"));
            break; 
          }
        }
      },
      { threshold: 0.7 } // 70% of the item must be visible
    );

    const shortsElements = containerRef.current?.querySelectorAll("[data-short-id]");
    shortsElements?.forEach((el) => observer.observe(el));

    return () => {
      shortsElements?.forEach((el) => observer.unobserve(el));
    };
  }, [shorts, loading]);
  
    if(loading) {
        return <div className="h-full w-full flex items-center justify-center text-white">Loading shorts...</div>
    }

    if(shorts.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-white">No shorts available.</div>
    }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-4rem)] w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar"
    >
      {shorts.map((short) => (
        <div key={short.id} data-short-id={short.id} className="h-full w-full snap-start">
            <ShortCard 
              short={short} 
              isIntersecting={visibleShortId === short.id}
            />
        </div>
      ))}
    </div>
  );
}
