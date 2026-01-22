"use client";

import { VideoCard } from "@/components/video-card";
import { Separator } from "@/components/ui/separator";
import React, { useState, useEffect } from "react";
import { ShortsShelf } from "@/components/shorts-shelf";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, getDoc, doc } from "firebase/firestore";
import { Video, Channel } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { mockVideos } from "@/lib/mock-data";
import { CategoryShelf } from "@/components/category-shelf";
import { SplashScreen } from "@/components/splash-screen";

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem('splashShown', 'true');
    }
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("visibility", "==", "public"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log("No videos found in Firestore, falling back to mock data.");
          setVideos(mockVideos);
          return;
        }

        const fetchedVideos: Video[] = await Promise.all(querySnapshot.docs.map(async (videoDoc) => {
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
        
        setVideos(fetchedVideos.filter(v => v.channel));

      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos(mockVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleSplashFinished = () => {
    setShowSplash(false);
  };
  
  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  const filteredVideos = videos.filter(v => {
      if (selectedCategory === "All") return true;
      return v.category === selectedCategory;
  });

  const longVideos = filteredVideos.filter(v => v.type === 'long');
  const shorts = filteredVideos.filter(v => v.type === 'short');

  if (loading) {
      return (
          <>
            <CategoryShelf selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
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
          </>
      )
  }

  return (
    <div className="flex flex-col">
      <CategoryShelf selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      <div className="flex flex-col">
        
        {longVideos.length > 0 && (
            <div className="flex flex-col space-y-6 p-4">
            {longVideos.map((video, index) => (
                <React.Fragment key={video.id}>
                <VideoCard video={video} />
                {(index < longVideos.length - 1) && <Separator className="my-2" />}
                </React.Fragment>
            ))}
            </div>
        )}

        {shorts.length > 0 && <ShortsShelf shorts={shorts} />}

        {!loading && videos.length > 0 && filteredVideos.length === 0 && (
             <p className="text-center text-muted-foreground py-16">No videos found in the "{selectedCategory}" category.</p>
        )}
        
        {!loading && videos.length === 0 && (
             <p className="text-center text-muted-foreground py-16">No videos found. Be the first to upload!</p>
        )}
      </div>
    </div>
  );
}
