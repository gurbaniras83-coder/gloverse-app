import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import ChannelPageContent from './client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
            : new Date(channelData.createdAt || Date.now()).toISOString(),
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
    
    if (!handle) {
      notFound();
    }

    const { channel, videos } = await getChannelData(handle);

    if (!channel) {
        notFound();
    }

    return (
        <ChannelPageContent initialChannel={channel} initialVideos={videos} />
      );
}
