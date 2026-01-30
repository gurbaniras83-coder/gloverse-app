
'use client';

import { useState, useEffect, useRef } from "react";
import { formatViews, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bell, Share2 } from "lucide-react";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { CommentSection } from "@/components/comment-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Video, Channel } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, increment, writeBatch, setDoc, deleteDoc, limit, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { CustomVideoPlayer } from "@/components/custom-video-player";
import { BannerAd } from "@/components/ads/BannerAd";

interface WatchPageClientProps {
  initialVideo: Video;
  initialSuggestedVideos: Video[];
}

export default function WatchPageClient({ initialVideo, initialSuggestedVideos }: WatchPageClientProps) {
  const videoId = initialVideo.id;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const videoPlayerRef = useRef<{ video: HTMLVideoElement | null }>(null);
  const historyTrackedRef = useRef(false);

  const [video, setVideo] = useState<Video | null | undefined>(() => ({
      ...initialVideo,
      createdAt: new Date(initialVideo.createdAt as any)
  }));
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>(() => 
      initialSuggestedVideos.map(v => ({...v, createdAt: new Date(v.createdAt as any)}))
  );

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [likeCount, setLikeCount] = useState(initialVideo.likes || 0);

  // History tracking logic
  useEffect(() => {
    const videoElement = videoPlayerRef.current?.video;
    if (!videoElement || !user || !videoId) {
        return;
    }

    const handleTimeUpdate = async () => {
        if (videoElement.currentTime > 10 && !historyTrackedRef.current) {
            historyTrackedRef.current = true; // Prevent multiple writes
            videoElement.removeEventListener("timeupdate", handleTimeUpdate);
            try {
                const historyRef = doc(db, "users", user.uid, "history", videoId);
                await setDoc(historyRef, {
                    videoId: videoId,
                    watchedAt: serverTimestamp(),
                }, { merge: true });
            } catch (error) {
                console.error("Failed to save to history:", error);
            }
        }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
        if (videoElement) {
            videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        }
    };
  }, [user, videoId, video]);


  // Unique view count logic, runs only on client after hydration
  useEffect(() => {
    historyTrackedRef.current = false; // Reset history tracking for new video
    if (videoId && video) {
        const viewedVideosKey = 'viewedVideos';
        try {
            const viewedVideos = JSON.parse(localStorage.getItem(viewedVideosKey) || '[]');
            if (!viewedVideos.includes(videoId)) {
                const videoRef = doc(db, "videos", videoId);
                updateDoc(videoRef, { views: increment(1) });
                
                viewedVideos.push(videoId);
                localStorage.setItem(viewedVideosKey, JSON.stringify(viewedVideos));

                // Optimistically update state
                setVideo(v => v ? { ...v, views: (v.views || 0) + 1 } : null);
            }
        } catch (error) {
            console.error("Error processing view count:", error);
        }
    }
  }, [videoId, video]);


  useEffect(() => {
    const checkStatus = async () => {
        if (!user || !video || authLoading || !video.channel) return;
        
        // Check Like Status
        const likeRef = doc(db, "videos", video.id, "likes", user.uid);
        const likeSnap = await getDoc(likeRef);
        setIsLiked(likeSnap.exists());
        
        // Check Subscription Status
        if(user.uid !== video.channel.id) {
            const subRef = doc(db, "users", user.uid, "subscriptions", video.channel.id);
            const subSnap = await getDoc(subRef);
            setIsSubscribed(subSnap.exists());
        }
    };
    checkStatus();
  }, [user, video, authLoading]);

  const handleLikeToggle = async () => {
    if (!user || !video || isInteracting) {
        if (!user) toast({ variant: 'destructive', title: 'You must be logged in to like videos.'});
        return;
    };
    setIsInteracting(true);
    const likeRef = doc(db, "videos", video.id, "likes", user.uid);
    const videoRef = doc(db, "videos", video.id);

    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(videoRef, { likes: increment(-1) });
        setLikeCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like
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

  const handleSubscribeToggle = async () => {
    if (!user || !video || isInteracting || !video.channel || user.uid === video.channel.id) {
         if (!user) toast({ variant: 'destructive', title: 'You must be logged in to subscribe.'});
        return;
    };
    setIsInteracting(true);
    
    const subRef = doc(db, "users", user.uid, "subscriptions", video.channel.id);
    const channelRef = doc(db, "channels", video.channel.id);
    
    try {
        const subSnap = await getDoc(subRef);
        const batch = writeBatch(db);
        if (subSnap.exists()) {
            // Unsubscribe
            batch.delete(subRef);
            batch.update(channelRef, { subscribers: increment(-1) });
            if (video.channel) setVideo(v => v ? { ...v, channel: { ...v.channel!, subscribers: Math.max(0, v.channel!.subscribers -1) } } : null);
            setIsSubscribed(false);
        } else {
            // Subscribe
            batch.set(subRef, { subscribedAt: new Date() });
            batch.update(channelRef, { subscribers: increment(1) });
            if (video.channel) setVideo(v => v ? { ...v, channel: { ...v.channel!, subscribers: v.channel!.subscribers + 1 } } : null);
            setIsSubscribed(true);
        }
        await batch.commit();
    } catch (error) {
        console.error("Subscription error:", error);
        toast({ variant: 'destructive', title: 'Error updating subscription.' });
    } finally {
        setIsInteracting(false);
    }
  }
  
  const handleShare = async () => {
    if (!video) return;
    const shareUrl = `https://gloverse-app.vercel.app/watch?v=${video.id}`;
    const shareData = {
        title: video.title,
        text: video.description || `Watch "${video.title}" on GloVerse!`,
        url: shareUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
              console.error("Error sharing:", error);
            }
        }
    } else {
        navigator.clipboard.writeText(shareUrl);
        toast({
            title: "Link Copied!",
            description: "The video link has been copied to your clipboard.",
        });
    }
  };

  
  if (video === undefined || authLoading) {
      return <div>Loading...</div>; // This should be handled by loading.tsx now
  }

  if (video === null) {
      return <div className="flex h-96 items-center justify-center">Video not found.</div>
  }
  
  const timeAgo = video.createdAt ? formatDistanceToNow(video.createdAt, { addSuffix: true }) : '...';

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 w-full bg-black">
        <CustomVideoPlayer ref={videoPlayerRef} src={video.videoUrl} autoPlay />
      </div>

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatViews(video.views)} views &middot; {timeAgo}
        </p>

        {video.channel && (
          <div className="flex items-center justify-between">
            <Link href={`/@${video.channel.handle}`} className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={video.channel.photoURL} alt={video.channel.handle} />
                <AvatarFallback>{video.channel.handle.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{video.channel.fullName}</p>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>{formatViews(video.channel.subscribers)} subscribers</p>
              </div>
            </Link>
            {user?.channel?.id !== video.channel.id && (
              <Button
                variant={isSubscribed ? "secondary" : "default"}
                onClick={handleSubscribeToggle}
                className="rounded-full"
                disabled={!user || isInteracting}
              >
                {isSubscribed && <Bell className="mr-2 h-4 w-4" />}
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant="secondary"
            className="rounded-full flex-shrink-0"
            onClick={handleLikeToggle}
            disabled={!user || isInteracting}
          >
            <ThumbsUp className={cn("mr-2 h-5 w-5", isLiked && "fill-primary text-primary")} />
            <span suppressHydrationWarning>{formatViews(likeCount)}</span>
          </Button>
          <Button
            variant="secondary"
            className="rounded-full flex-shrink-0"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
        </div>
        
        <div className="my-4">
          <BannerAd />
        </div>

        {user?.channel?.id === video.channel?.id && (
          <div className="p-3 rounded-lg bg-secondary border border-primary/50">
            <h3 className="text-lg font-semibold mb-2">Your Video Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Views</p>
                <p className="font-bold text-lg" suppressHydrationWarning>{formatViews(video.views)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Likes</p>
                <p className="font-bold text-lg" suppressHydrationWarning>{formatViews(likeCount)}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/studio">Go to Studio</Link>
            </Button>
          </div>
        )}

        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-sm whitespace-pre-wrap">{video.description || "No description available."}</p>
        </div>
        
        <Separator />

        <CommentSection videoId={video.id} />
        
        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-bold">Up next</h3>
          {suggestedVideos.map((nextVideo) => (
            <VideoCard key={nextVideo.id} video={nextVideo} />
          ))}
        </div>
      </div>
    </div>
  );
}
