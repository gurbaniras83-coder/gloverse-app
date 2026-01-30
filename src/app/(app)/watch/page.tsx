
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import WatchPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Video, Channel } from "@/lib/types";

async function getVideoData(videoId: string): Promise<Video | null> {
    if (!videoId) return null;
    
    try {
        const videoRef = doc(db, "videos", videoId);
        const videoSnap = await getDoc(videoRef);

        if (!videoSnap.exists()) {
            return null;
        }

        const videoData = { ...videoSnap.data(), id: videoSnap.id } as Video;
        
        if (videoData.channelId) {
            const channelRef = doc(db, "channels", videoData.channelId);
            const channelSnap = await getDoc(channelRef);
            if (channelSnap.exists()) {
                videoData.channel = { ...channelSnap.data(), id: channelSnap.id } as Channel;
            }
        }

        // Make serializable
        return {
            ...videoData,
            createdAt: (videoData.createdAt as any)?.toDate ? (videoData.createdAt as any).toDate().toISOString() : new Date().toISOString(),
        } as any;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function generateMetadata({ searchParams }: { searchParams: { v?: string } }): Promise<Metadata> {
  const videoId = searchParams.v;
  if (!videoId) {
    return { 
        title: "GloVerse",
        description: "Unleash Your Inner Star",
     };
  }

  const video = await getVideoData(videoId);
  
  if (!video) {
    return { 
        title: "Video Not Found | GloVerse",
        description: "The video you are looking for does not exist.",
     };
  }

  return {
    title: video.title,
    description: video.description || "Watch this video on GloVerse.",
    openGraph: {
      title: video.title,
      description: video.description || "Watch this video on GloVerse.",
      url: `https://gloverse-app.vercel.app/watch?v=${videoId}`,
      siteName: 'GloVerse',
      images: [
        {
          url: video.thumbnailUrl,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
      locale: 'en_US',
      type: 'video.other',
    },
     twitter: {
        card: "summary_large_image",
        title: video.title,
        description: video.description || "Watch this video on GloVerse.",
        images: [video.thumbnailUrl],
    },
  };
}

async function getSuggestedVideos(videoId: string) {
    if (!videoId) return [];
    
    const suggestedQuery = query(
        collection(db, "videos"), 
        where("visibility", "==", "public"),
        // where("type", "==", "long"),
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
                createdAt: videoData.createdAt?.toDate ? videoData.createdAt.toDate().toISOString() : new Date().toISOString(),
                channel: channelData,
            } as any;
    }));
    return allSuggested.filter(v => v.channel);
}


export default async function WatchRoutePage({ searchParams }: { searchParams: { v?: string }}) {
    const videoId = searchParams.v;
    if (!videoId) {
        notFound();
    }
    
    const video = await getVideoData(videoId);
    if (!video) {
        notFound();
    }
    const suggestedVideos = await getSuggestedVideos(videoId);

    // Pass serializable data to the client component
    return (
        <WatchPageClient 
            key={videoId} // Add key to force re-mount on navigation
            initialVideo={video} 
            initialSuggestedVideos={suggestedVideos} 
        />
    );
}
