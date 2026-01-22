
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import type { Channel, Video } from '@/lib/types';
import { BottomNav } from '@/components/layout/bottom-nav';
import ChannelPageContent from './client';

export async function generateStaticParams() {
    try {
        const snapshot = await getDocs(collection(db, "channels"));
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({
            handle: doc.data().handle,
        }));
    } catch (error) {
        console.error("Failed to generate static params for channels:", error);
        return [];
    }
}

async function getChannelData(handle: string): Promise<{ channel: any | null, videos: any[] }> {
    if (!handle) return { channel: null, videos: [] };

    const channelQuery = query(collection(db, "channels"), where("handle", "==", handle));
    const channelSnapshot = await getDocs(channelQuery);

    if (channelSnapshot.empty) {
        return { channel: null, videos: [] };
    }

    const channelDoc = channelSnapshot.docs[0];
    const channelData = { id: channelDoc.id, ...channelDoc.data() };
    
    const serializableChannel = {
        ...channelData,
        createdAt: (channelData.createdAt && (channelData.createdAt as any).toDate) 
            ? (channelData.createdAt as any).toDate().toISOString() 
            : (channelData.createdAt || new Date().toISOString()),
    };

    const videosQuery = query(collection(db, "videos"), where("channelId", "==", serializableChannel.id), where("visibility", "==", "public"));
    const videosSnapshot = await getDocs(videosQuery);
    
    const videosData = videosSnapshot.docs.map(doc => {
        const videoData = doc.data();
        return {
            id: doc.id,
            ...videoData,
            createdAt: videoData.createdAt?.toDate ? videoData.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
    });

    const sortedVideos = videosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { channel: serializableChannel, videos: sortedVideos };
}


export default async function ChannelRoutePage({ params }: { params: { handle: string }}) {
    const handle = params.handle ? decodeURIComponent(params.handle as string).replace('@', '') : "";
    const { channel, videos } = await getChannelData(handle);

    return (
        <div className="relative mx-auto flex min-h-screen w-full max-w-[500px] flex-col bg-background">
          <main className="flex-1 pb-16">
            <ChannelPageContent initialChannel={channel} initialVideos={videos} />
          </main>
          <BottomNav />
        </div>
      );
}
