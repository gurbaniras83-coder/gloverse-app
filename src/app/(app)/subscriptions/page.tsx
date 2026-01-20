"use client";

import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { useAuth } from "@/context/auth-provider";
import { useState, useEffect } from "react";
import type { Video, Channel } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export const dynamic = 'force-dynamic';

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish
    if (authLoading) {
      return;
    }
    // If auth is done and no user, stop loading. UI will show login prompt.
    if (!user) {
      setIsLoading(false);
      setVideos([]);
      return;
    }

    // User is logged in, fetch data
    let isMounted = true;
    // Failsafe timeout
    const fetchTimeout = setTimeout(() => {
        if (isMounted) setIsLoading(false);
    }, 2500); // A bit longer since it's a more complex query

    const fetchSubscribedVideos = async () => {
      try {
        // 1. Get user's subscriptions
        const subsRef = collection(db, "users", user.uid, "subscriptions");
        const subsSnapshot = await getDocs(subsRef);
        const subscribedChannelIds = subsSnapshot.docs.map(doc => doc.id);

        if (subscribedChannelIds.length === 0) {
          if (isMounted) setVideos([]);
          return;
        }

        // 2. Fetch videos from subscribed channels
        const videosQuery = query(
            collection(db, "videos"), 
            where("channelId", "in", subscribedChannelIds.slice(0, 30)), // Firestore 'in' query limited to 30
            where("visibility", "==", "public")
        );
        const videosSnapshot = await getDocs(videosQuery);
        
        const fetchedVideos = await Promise.all(videosSnapshot.docs.map(async (videoDoc) => {
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

        if (isMounted) {
            const sortedVideos = fetchedVideos.filter(v => v.channel).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setVideos(sortedVideos);
        }

      } catch (error) {
        console.error("Error fetching subscribed videos:", error);
        if (isMounted) {
            toast({ variant: 'destructive', title: "Could not load subscriptions."});
            setVideos([]);
        }
      } finally {
        if (isMounted) {
            clearTimeout(fetchTimeout);
            setIsLoading(false);
        }
      }
    };

    fetchSubscribedVideos();

    return () => {
        isMounted = false;
        clearTimeout(fetchTimeout);
    }
  }, [user, authLoading, toast]);
  
  // Display loader while auth state is resolving or initial data is being fetched
  if (authLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not loading, and no user, show login prompt
  if (!user) {
     return (
         <div className="flex flex-col items-center justify-center text-center h-96">
          <Clapperboard className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">See videos from your subscriptions</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Log in to see videos from channels you follow.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login">
              Log In
            </Link>
          </Button>
        </div>
     )
  }

  // If user is logged in, and videos have been fetched (or are empty)
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold font-headline mb-4">Subscriptions</h1>
      {videos.length > 0 ? (
        <div className="space-y-6">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-96">
          <Clapperboard className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No new videos</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Videos from channels you subscribe to will appear here.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/">
              Explore Videos
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
