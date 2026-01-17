"use client";

import { VideoCard } from "@/components/video-card";
import { Separator } from "@/components/ui/separator";
import React, { useState, useEffect } from "react";
import { ShortsShelf } from "@/components/shorts-shelf";
import { Logo } from "@/components/ui/logo";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, getDoc, doc, limit } from "firebase/firestore";
import { Video, Channel } from "@/lib/types";
import { mockVideos } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("visibility", "==", "public"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        let fetchedVideos: Video[] = [];
        if (!querySnapshot.empty) {
            fetchedVideos = await Promise.all(querySnapshot.docs.map(async (videoDoc) => {
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
            // Filter out videos where channel data could not be fetched
            fetchedVideos = fetchedVideos.filter(v => v.channel);
        }

        // If Firestore is empty or fetching failed partially, use mock data.
        if (fetchedVideos.length === 0) {
            setVideos(mockVideos);
        } else {
            setVideos(fetchedVideos);
        }

      } catch (error) {
        console.error("Error fetching videos, falling back to mock data:", error);
        setVideos(mockVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const longVideos = videos.filter(v => v.type === 'long');
  const shorts = videos.filter(v => v.type === 'short');

  const firstLongVideos = longVideos.slice(0, 3);
  const remainingLongVideos = longVideos.slice(3);
  
  if (loading) {
      return (
          <div className="flex flex-col">
            <header className="p-4"><Logo /></header>
            <div className="p-4 space-y-6">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
                 <Separator />
                <Skeleton className="w-full aspect-video rounded-xl" />
                 <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col">
      <header className="p-4">
        <Logo />
      </header>
      <div className="flex flex-col">
        
        {firstLongVideos.length > 0 && (
            <div className="flex flex-col space-y-6 p-4">
            {firstLongVideos.map((video, index) => (
                <React.Fragment key={`first-${video.id}`}>
                <VideoCard video={video} />
                {index < firstLongVideos.length -1 && <Separator className="my-2" />}
                </React.Fragment>
            ))}
            </div>
        )}

        {shorts.length > 0 && <ShortsShelf shorts={shorts} />}

        {remainingLongVideos.length > 0 && (
            <div className="flex flex-col space-y-6 p-4 pt-6">
            {remainingLongVideos.map((video, index) => (
                <React.Fragment key={`remaining-${video.id}`}>
                <VideoCard video={video} />
                {index < remainingLongVideos.length - 1 && <Separator className="my-2" />}
                </React.Fragment>
            ))}
            </div>
        )}
        
        {!loading && videos.length === 0 && (
             <p className="text-center text-muted-foreground py-16">No videos found.</p>
        )}
      </div>
    </div>
  );
}
