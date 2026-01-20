
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

export const dynamic = 'force-dynamic';

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      setVideos([]);
      return;
    }

    const fetchSubscribedVideos = async () => {
      setIsLoading(true);
      try {
        // 1. Get user's subscriptions
        const subsRef = collection(db, "users", user.uid, "subscriptions");
        const subsSnapshot = await getDocs(subsRef);
        const subscribedChannelIds = subsSnapshot.docs.map(doc => doc.id);

        if (subscribedChannelIds.length === 0) {
          setVideos([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch videos from subscribed channels
        // Firestore 'in' query is limited to 30 items. For a larger scale app, this would need a different data model (e.g., a "feed" collection for each user).
        const videosQuery = query(collection(db, "videos"), where("channelId", "in", subscribedChannelIds), where("visibility", "==", "public"));
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

        const sortedVideos = fetchedVideos.filter(v => v.channel).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setVideos(sortedVideos);

      } catch (error) {
        console.error("Error fetching subscribed videos:", error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscribedVideos();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <h2 className="text-xl font-semibold">No videos yet</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            {user ? "Videos from your subscriptions will appear here." : "Log in to see videos from your subscriptions."}
          </p>
          <Button asChild className="mt-4">
            <Link href={user ? "/" : "/login"}>
              {user ? "Explore Channels" : "Log In"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
