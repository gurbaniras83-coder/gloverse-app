"use client";

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2, Users, Clock, ThumbsUp, Video as VideoIcon, BarChart2, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Video } from "@/lib/types";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatViews } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function StudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.channel) {
      router.replace("/login");
      return;
    }

    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const videosQuery = query(
          collection(db, "videos"),
          where("channelId", "==", user.channel!.id),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(videosQuery);
        const userVideos = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
          channel: user.channel,
        })) as Video[];

        setVideos(userVideos);
        
        // Calculate Analytics
        const views = userVideos.reduce((acc, video) => acc + video.views, 0);
        const likes = userVideos.reduce((acc, video) => acc + (video.likes || 0), 0);
        setTotalViews(views);
        setTotalLikes(likes);

      } catch (error) {
        console.error("Error fetching user videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [user, loading, router]);


  if (loading || isLoading || !user?.channel) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const latestVideo = videos[0];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gloverse Studio</h1>
        <Button asChild variant="outline">
          <Link href={`/@${user.channel.handle}`}>View Channel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Analytics</CardTitle>
          <CardDescription>Current stats for your channel.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-secondary rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary"/>
            <p className="text-2xl font-bold">{formatViews(user.channel.subscribers)}</p>
            <p className="text-sm text-muted-foreground">Subscribers</p>
          </div>
           <div className="p-4 bg-secondary rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary"/>
            <p className="text-2xl font-bold">{formatViews(totalViews)}</p>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>
           <div className="p-4 bg-secondary rounded-lg">
            <VideoIcon className="w-6 h-6 mx-auto mb-2 text-primary"/>
            <p className="text-2xl font-bold">{videos.length}</p>
            <p className="text-sm text-muted-foreground">Videos</p>
          </div>
           <div className="p-4 bg-secondary rounded-lg">
            <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-primary"/>
            <p className="text-2xl font-bold">{formatViews(totalLikes)}</p>
            <p className="text-sm text-muted-foreground">Likes</p>
          </div>
        </CardContent>
      </Card>
      
      {latestVideo && (
        <Card>
           <CardHeader>
            <CardTitle>Latest Video Performance</CardTitle>
            <CardDescription>Stats for your newest video.</CardDescription>
           </CardHeader>
           <CardContent>
            <VideoCard video={latestVideo} />
           </CardContent>
        </Card>
      )}

      <Separator />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Manage Videos</h2>
           <Button asChild variant="default" size="sm">
            <Link href="/upload">Upload New</Link>
          </Button>
        </div>
        {videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map(video => (
              <div key={video.id} className="p-2 rounded-lg hover:bg-secondary">
                 <VideoCard video={video} />
                 <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full"><Edit className="w-4 h-4 mr-2"/> Edit</Button>
                    <Button variant="destructive" size="sm" className="w-full"><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">You haven't uploaded any videos yet.</p>
        )}
      </div>
    </div>
  );
}
