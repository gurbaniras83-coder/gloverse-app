"use client";

import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-provider";
import { useState, useEffect } from "react";
import type { Video } from "@/lib/types";

export default function SubscriptionsPage() {
  const { user, loading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsLoading(false);
      setVideos([]);
      return;
    }

    // In a real app, you would fetch the user's subscription list from Firestore,
    // then fetch the videos for those channels.
    // For this example, we'll simulate it with mock data.
    const fetchSubscribedVideos = async () => {
      setIsLoading(true);
      // Simulating a network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // We'll assume the user is subscribed to the first two mock channels.
      const subscribedChannelIds = [mockVideos[0].channel.id, mockVideos[1].channel.id];
      const subscribedVideos = mockVideos.filter(video => 
        subscribedChannelIds.includes(video.channel.id) && video.type === 'long'
      );
      
      setVideos(subscribedVideos);
      setIsLoading(false);
    };

    fetchSubscribedVideos();
  }, [user, loading]);

  if (isLoading || loading) {
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
