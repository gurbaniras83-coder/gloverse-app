"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { formatViews, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bell } from "lucide-react";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { CommentSection } from "@/components/comment-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Video, Channel } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, increment, writeBatch, setDoc, deleteDoc, limit } from "firebase/firestore";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [video, setVideo] = useState<Video | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchVideoData = useCallback(async () => {
    if (!videoId) return;
    
    try {
      const videoRef = doc(db, "videos", videoId);
      const videoSnap = await getDoc(videoRef);

      if (!videoSnap.exists()) {
          setVideo(null);
          return;
      }

      const videoData = { ...videoSnap.data(), id: videoSnap.id, createdAt: videoSnap.data().createdAt.toDate() } as Video;
      
      if (videoData.channelId) {
        const channelRef = doc(db, "channels", videoData.channelId);
        const channelSnap = await getDoc(channelRef);
        if (channelSnap.exists()) {
            videoData.channel = { ...channelSnap.data(), id: channelSnap.id } as Channel;
        }
      }
      
      setVideo(videoData);
      setLikeCount(videoData.likes || 0);

      // Unique view count logic
      const viewedVideos = JSON.parse(localStorage.getItem('viewedVideos') || '[]');
      if (!viewedVideos.includes(videoId)) {
          await updateDoc(videoRef, { views: increment(1) });
          viewedVideos.push(videoId);
          localStorage.setItem('viewedVideos', JSON.stringify(viewedVideos));
          setVideo(v => v ? { ...v, views: v.views + 1 } : null);
      }
    } catch(e) {
      console.error(e);
      setVideo(null);
    }
  }, [videoId]);

  const fetchSuggestedVideos = useCallback(async () => {
    if (!videoId) return;
     const suggestedQuery = query(
        collection(db, "videos"), 
        where("visibility", "==", "public"),
        where("type", "==", "long"),
        orderBy("createdAt", "desc"),
        limit(10)
    );
    const suggestedSnap = await getDocs(suggestedQuery);
    const allSuggested = await Promise.all(suggestedSnap.docs
        .filter(doc => doc.id !== videoId)
        .map(async (videoDoc) => {
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
    setSuggestedVideos(allSuggested.filter(v => v.channel));
  }, [videoId])

  useEffect(() => {
    fetchVideoData();
    fetchSuggestedVideos();
  }, [fetchVideoData, fetchSuggestedVideos]);

  useEffect(() => {
    const checkStatus = async () => {
        if (!user || !video || authLoading || !video.channel) return;
        
        const likeRef = doc(db, "videos", video.id, "likes", user.uid);
        const likeSnap = await getDoc(likeRef);
        setIsLiked(likeSnap.exists());
        
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
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(videoRef, { likes: increment(-1) });
        setLikeCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, { likedAt: new Date() });
        await updateDoc(videoRef, { likes: increment(1) });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
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
        const batch = writeBatch(db);
        if (isSubscribed) {
            batch.delete(subRef);
            batch.update(channelRef, { subscribers: increment(-1) });
            if (video.channel) setVideo(v => v ? { ...v, channel: { ...v.channel!, subscribers: v.channel!.subscribers -1 } } : null);
        } else {
            batch.set(subRef, { subscribedAt: new Date() });
            batch.update(channelRef, { subscribers: increment(1) });
            if (video.channel) setVideo(v => v ? { ...v, channel: { ...v.channel!, subscribers: v.channel!.subscribers + 1 } } : null);
        }
        await batch.commit();
        setIsSubscribed(!isSubscribed);
    } catch (error) {
        console.error("Subscription error:", error);
        toast({ variant: 'destructive', title: 'Error updating subscription.' });
    } finally {
        setIsInteracting(false);
    }
  }

  if (!video) {
    return <WatchPageSkeleton />;
  }
  
  const timeAgo = formatDistanceToNow(video.createdAt, { addSuffix: true });

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 aspect-video w-full bg-black">
        <video src={video.videoUrl} controls autoPlay className="h-full w-full" />
      </div>

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
        <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">{formatViews(video.channel.subscribers)} subscribers</p>
              </div>
            </Link>
            {user?.uid !== video.channel.id && (
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
            {formatViews(likeCount)}
          </Button>
        </div>
        
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-sm whitespace-pre-wrap">{video.description}</p>
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

function WatchPageSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="sticky top-0 z-10 aspect-video w-full" />
      <div className="p-4 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="p-3 rounded-lg bg-secondary space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<WatchPageSkeleton />}>
      <WatchPageContent />
    </Suspense>
  );
}
