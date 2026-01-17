"use client";

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2, Users, Clock, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user?.channel) {
    router.replace("/login");
    return null;
  }

  const userVideos = mockVideos.filter(v => v.channel.id === user.channel?.id);

  // Mock data for monetization
  const subscribersGoal = 300;
  const watchHoursGoal = 500;
  const currentSubscribers = user.channel.subscribers;
  const currentWatchHours = 275; // Mock data

  const subscriberProgress = Math.min((currentSubscribers / subscribersGoal) * 100, 100);
  const watchHourProgress = Math.min((currentWatchHours / watchHoursGoal) * 100, 100);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gloverse Studio</h1>
        <BarChart2 className="w-6 h-6 text-primary"/>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monetization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4"/>Subscribers</p>
              <p className="text-sm text-muted-foreground">{currentSubscribers.toLocaleString()} / {subscribersGoal.toLocaleString()}</p>
            </div>
            <Progress value={subscriberProgress} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4"/>Watch Hours</p>
              <p className="text-sm text-muted-foreground">{currentWatchHours.toLocaleString()} / {watchHoursGoal.toLocaleString()}</p>
            </div>
            <Progress value={watchHourProgress} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Videos</h2>
           <Button asChild variant="outline" size="sm">
            <Link href="/upload">Upload New</Link>
          </Button>
        </div>
        {userVideos.length > 0 ? (
          <div className="space-y-6">
            {userVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">You haven't uploaded any videos yet.</p>
        )}
      </div>
    </div>
  );
}
