"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { mockVideos, mockChannels } from "@/lib/mock-data";
import { formatViews } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bell, ArrowDownToLine } from "lucide-react";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { CommentSection } from "@/components/comment-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import type { Video } from "@/lib/types";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");
  const [video, setVideo] = useState<Video | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // In a real app, fetch video data from an API/Firestore
    const foundVideo = mockVideos.find((v) => v.id === videoId);
    // Setting state in useEffect to avoid hydration mismatch
    if (foundVideo) {
      setVideo(foundVideo);
    }
  }, [videoId]);

  if (!video) {
    return <WatchPageSkeleton />;
  }

  const timeAgo = formatDistanceToNow(video.createdAt, { addSuffix: true });

  return (
    <div className="flex flex-col">
      {/* Video Player */}
      <div className="sticky top-0 z-10 aspect-video w-full bg-black">
        <video src={video.videoUrl} controls autoPlay className="h-full w-full" />
      </div>

      <div className="p-4 space-y-4">
        {/* Title and Metadata */}
        <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatViews(video.views)} views &middot; {timeAgo}
        </p>

        {/* Channel Info and Subscribe Button */}
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
          <Button
            variant={isSubscribed ? "secondary" : "default"}
            onClick={() => setIsSubscribed(!isSubscribed)}
            className="rounded-full"
          >
            {isSubscribed && <Bell className="mr-2 h-4 w-4" />}
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant="secondary"
            className="rounded-full flex-shrink-0"
            onClick={() => setIsLiked(!isLiked)}
          >
            <ThumbsUp className={cn("mr-2 h-5 w-5", isLiked && "fill-primary text-primary")} />
            {formatViews(video.views)}
          </Button>
          <Button variant="secondary" className="rounded-full flex-shrink-0">
            <ArrowDownToLine className="mr-2 h-5 w-5" />
            Download
          </Button>
        </div>
        
        {/* Description */}
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-sm whitespace-pre-wrap">{video.description}</p>
        </div>
        
        <Separator />

        {/* Comments */}
        <CommentSection videoId={video.id} />
        
        <Separator />

        {/* Suggested Videos */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Up next</h3>
          {mockVideos.filter(v => v.id !== videoId).map((nextVideo) => (
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
