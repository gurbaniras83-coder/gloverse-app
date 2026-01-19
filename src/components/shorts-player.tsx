"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import type { Channel } from "@/lib/types";

interface ShortCardProps {
  short: Video;
  isIntersecting: boolean;
  isMuted: boolean;
  toggleMute: (e: React.MouseEvent) => void;
  setIsMuted: (isMuted: boolean) => void;
}

function ShortCard({ short, isIntersecting, isMuted, toggleMute, setIsMuted }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (isIntersecting) {
      videoElement?.play().then(() => setIsPlaying(true)).catch(error => {
        console.error("Video play failed:", error);
        setIsPlaying(false);
      });
    } else {
      videoElement?.pause();
      setIsPlaying(false);
      if(videoElement?.currentTime) {
        videoElement.currentTime = 0;
      }
    }
  }, [isIntersecting]);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      if (isMuted) {
        setIsMuted(false);
      }
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  if (!short.channel) return null;

  return (
    <div className="relative h-full w-full snap-start overflow-hidden bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        className="h-full w-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="h-16 w-16 text-white/70" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

      <div className="absolute bottom-4 left-4 text-white">
        <Link href={`/@${short.channel.handle}`} className="flex items-center gap-2 group" onClick={e => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={short.channel.photoURL} />
            <AvatarFallback>{short.channel.handle[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold group-hover:underline">@{short.channel.handle}</span>
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
        <button onClick={toggleMute} className="mt-2 text-white p-2" aria-label="Toggle mute">
          {isMuted ? <VolumeX className="h-6 w-6"/> : <Volume2 className="h-6 w-6"/>}
        </button>
      </div>
    </div>
  );
}

export function ShortsPlayer() {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleShortId, setVisibleShortId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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

        if (shortsSnapshot.empty) {
            setShorts([]);
            setLoading(false);
            return;
        }
        
        let fetchedShorts = await Promise.all(shortsSnapshot.docs.map(async (videoDoc) => {
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
        
        const hashId = window.location.hash.substring(1);
        if (hashId) {
            const requestedShortIndex = fetchedShorts.findIndex(s => s.id === hashId);
            if (requestedShortIndex > 0) {
                const requestedShort = fetchedShorts.splice(requestedShortIndex, 1)[0];
                fetchedShorts.unshift(requestedShort);
            }
        }
        
        setShorts(fetchedShorts);

      } catch (error) {
        console.error("Error fetching shorts:", error);
        setShorts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  useEffect(() => {
    if (loading || shorts.length === 0) return;
    
    if (!visibleShortId) {
        setVisibleShortId(shorts[0].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const shortId = entry.target.getAttribute("data-short-id");
            setVisibleShortId(shortId);
            if(shortId) {
                const newUrl = `${window.location.pathname}#${shortId}`;
                window.history.replaceState(null, '', newUrl);
            }
            break; 
          }
        }
      },
      { threshold: 0.7 }
    );

    const shortsElements = containerRef.current?.querySelectorAll("[data-short-id]");
    shortsElements?.forEach((el) => observer.observe(el));

    const hashId = window.location.hash.substring(1);
    if(hashId) {
        const element = document.querySelector(`[data-short-id="${hashId}"]`);
        element?.scrollIntoView();
    }


    return () => {
      shortsElements?.forEach((el) => observer.unobserve(el));
    };
  }, [shorts, loading, visibleShortId]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }
  
    if(loading) {
        return <div className="h-full w-full flex items-center justify-center text-white bg-black"><Loader2 className="w-8 h-8 animate-spin"/></div>
    }

    if(shorts.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-white bg-black">No shorts available.</div>
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
              isMuted={isMuted}
              toggleMute={toggleMute}
              setIsMuted={setIsMuted}
            />
        </div>
      ))}
    </div>
  );
}
