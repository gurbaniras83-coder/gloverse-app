import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import ChannelPageContent from './client';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    try {
        const snapshot = await getDocs(collection(db, "channels"));
        if (snapshot.empty) {
            console.warn("No channels found to generate static params.");
            return [];
        }
        // Filter out any documents that might not have a valid handle
        return snapshot.docs
            .map(doc => doc.data().handle)
            .filter(handle => typeof handle === 'string' && handle.length > 0)
            .map(handle => ({
                handle: handle,
            }));
    } catch (error) {
        console.error("Error fetching channels for generateStaticParams:", error);
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

    const videosQuery = query(collection(db, "videos"), 
        where("channelId", "==", serializableChannel.id), 
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc")
    );
    const videosSnapshot = await getDocs(videosQuery);
    
    const videosData = videosSnapshot.docs.map(doc => {
        const videoData = doc.data();
        return {
            id: doc.id,
            ...videoData,
            createdAt: videoData.createdAt?.toDate ? videoData.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
    });

    return { channel: serializableChannel, videos: videosData };
}

export default async function ChannelRoutePage({ params }: { params: { handle: string }}) {
    const handle = params.handle ? decodeURIComponent(params.handle as string).replace('@', '') : "";
    const { channel, videos } = await getChannelData(handle);

    if (!channel) {
        notFound();
    }

    return (
        <ChannelPageContent initialChannel={channel} initialVideos={videos} />
      );
}
