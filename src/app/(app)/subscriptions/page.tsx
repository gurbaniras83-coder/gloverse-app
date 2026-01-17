import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/mock-data";

export default function SubscriptionsPage() {
  // In a real app, this would be a filtered list of videos
  // from channels the user is subscribed to.
  const subscribedVideos = mockVideos.slice(0, 2);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold font-headline mb-4">Subscriptions</h1>
      {subscribedVideos.length > 0 ? (
        <div className="space-y-6">
          {subscribedVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-96">
          <Clapperboard className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No videos yet</h2>
          <p className="text-muted-foreground mt-2">
            Videos from your subscriptions will appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Explore Channels</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
