
"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import type { Channel } from "@/lib/types";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { formatViews } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CommentSection } from "@/components/comment-section";

interface ShortCardProps {
  short: Video;
  isIntersecting: boolean;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  hasInteracted: boolean;
  setHasInteracted: (hasInteracted: boolean) => void;
}

function ShortCard({ short, isIntersecting, isMuted, setIsMuted, hasInteracted, setHasInteracted }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(short.likes || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!short.id) return;
    const commentsRef = collection(db, "videos", short.id, "comments");
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        setCommentCount(snapshot.size);
    }, (error) => {
        console.error("Error fetching comment count:", error);
    });
    return () => unsubscribe();
  }, [short.id]);
  
  useEffect(() => {
    if (!user || !short.id) {
        setIsLiked(false);
        return;
    };
    const likeRef = doc(db, "videos", short.id, "likes", user.uid);
    const unsubscribe = onSnapshot(likeRef, (doc) => {
        setIsLiked(doc.exists());
    });
    return () => unsubscribe();
  }, [user, short.id]);


  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isIntersecting) {
      videoElement.muted = isMuted;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(error => {
          setIsPlaying(false);
        });
      }
    } else {
      videoElement.pause();
      setIsPlaying(false);
      if(videoElement.currentTime > 0) {
        videoElement.currentTime = 0;
      }
    }
  }, [isIntersecting, isMuted]);

  const handleVideoPress = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setIsMuted(false);
    }
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play().catch(e => console.error("Play failed", e));
    } else {
      videoElement.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasInteracted) setHasInteracted(true);
    setIsMuted(!isMuted);
  };
  
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isInteracting) {
        if (!user) toast({ variant: 'destructive', title: 'You must be logged in to like videos.'});
        return;
    };
    setIsInteracting(true);
    const likeRef = doc(db, "videos", short.id, "likes", user.uid);
    const videoRef = doc(db, "videos", short.id);

    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(videoRef, { likes: increment(-1) });
        setLikeCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await setDoc(likeRef, { likedAt: new Date() });
        await updateDoc(videoRef, { likes: increment(1) });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Like error:", error);
      toast({ variant: 'destructive', title: 'Error updating like status.' });
    } finally {
      setIsInteracting(false);
    }
  }

  if (!short.channel) return null;

  return (
    <div className="relative h-full w-full snap-start overflow-hidden bg-black" onClick={handleVideoPress}>
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        className="h-full w-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {!isPlaying && hasInteracted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <Play className="h-16 w-16 text-white/70" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-10">
        <button onClick={toggleMute} className="text-white p-2" aria-label="Toggle mute">
          {isMuted ? <VolumeX className="h-6 w-6"/> : <Volume2 className="h-6 w-6"/>}
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 text-white">
        <Link href={`/@${short.channel.handle}`} className="flex items-center gap-2 group" onClick={e => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={short.channel.photoURL} alt={short.channel.handle} />
            <AvatarFallback>{short.channel.handle[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold group-hover:underline">@{short.channel.handle}</span>
        </Link>
        <p className="mt-2 text-sm pointer-events-none">{short.title}</p>
      </div>
      
      <div className="absolute bottom-4 right-2 flex flex-col items-center gap-4 text-white">
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={handleLikeToggle} disabled={!user || isInteracting}>
          <Heart className={cn("h-8 w-8 transition-colors", isLiked && "fill-red-500 text-red-500")} />
          <span className="text-xs font-semibold">{formatViews(likeCount)}</span>
        </Button>
        <Sheet onOpenChange={(open) => { if (open && isPlaying) videoRef.current?.pause(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={e => e.stopPropagation()}>
              <MessageCircle className="h-8 w-8" />
              <span className="text-xs font-semibold">{formatViews(commentCount)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80dvh] max-w-[500px] mx-auto flex flex-col p-0 bg-background border-t-0 rounded-t-2xl">
             <SheetHeader className="text-left p-4 border-b">
                <SheetTitle>Comments ({formatViews(commentCount)})</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <CommentSection videoId={short.id} />
            </div>
          </SheetContent>
        </Sheet>
        <Button variant="ghost" className="h-auto flex-col gap-1 p-0 text-white hover:bg-transparent hover:text-white" onClick={e => e.stopPropagation()}>
          <Send className="h-8 w-8" />
          <span className="text-xs">Share</span>
        </Button>
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
  const [hasInteracted, setHasInteracted] = useState(false);

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
    
    if (!visibleShortId && shorts.length > 0) {
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

    if(loading) {
        return <div className="h-full w-full flex items-center justify-center text-white bg-black"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
    }

    if(shorts.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-white bg-black">No shorts available.</div>
    }

  return (
    <div
      ref={containerRef}
      className="h-full w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar"
    >
      {shorts.map((short) => (
        <div key={short.id} data-short-id={short.id} className="h-full w-full snap-start">
            <ShortCard 
              short={short} 
              isIntersecting={visibleShortId === short.id}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              hasInteracted={hasInteracted}
              setHasInteracted={setHasInteracted}
            />
        </div>
      ))}
    </div>
  );
}
