"use client";

import { useParams } from 'next/navigation';
import { mockChannels, mockVideos } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import type { Channel, Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatViews } from '@/lib/utils';
import { VideoCard } from '@/components/video-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ChannelPageContent() {
    const params = useParams();
    const handle = params.handle as string;

    const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
    const [videos, setVideos] = useState<Video[]>([]);
    
    useEffect(() => {
        // In a real app, you would query Firestore for the channel by handle
        const foundChannel = mockChannels.find(c => c.handle === handle);
        setChannel(foundChannel || null);

        if (foundChannel) {
            const channelVideos = mockVideos.filter(v => v.channel.id === foundChannel.id);
            setVideos(channelVideos);
        }
    }, [handle]);

    if (channel === undefined) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (channel === null) {
        return (
            <div className="flex h-96 items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold">Channel not found</h2>
                <p className="text-muted-foreground">The handle @{handle} does not exist.</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col">
            <div className="p-4 flex flex-col items-center text-center space-y-3">
                <Avatar className="h-24 w-24 border-4 border-secondary">
                    <AvatarImage src={channel.photoURL} alt={channel.handle} />
                    <AvatarFallback className="text-3xl">{channel.handle[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{channel.fullName}</h1>
                    <p className="text-muted-foreground">@{channel.handle} &middot; {formatViews(channel.subscribers)} subscribers</p>
                </div>
                <p className="text-sm max-w-md">{channel.bio}</p>
                <Button className="rounded-full">Subscribe</Button>
            </div>

            <Tabs defaultValue="videos" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>
                <TabsContent value="videos" className="p-4 space-y-6">
                    {videos.filter(v => v.type === 'video').map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                    {videos.filter(v => v.type === 'video').length === 0 && <p className="text-center text-muted-foreground py-8">No videos yet.</p>}
                </TabsContent>
                <TabsContent value="shorts" className="p-4">
                     <p className="text-center text-muted-foreground py-8">Shorts are coming soon!</p>
                </TabsContent>
                 <TabsContent value="about" className="p-4 text-sm space-y-2">
                     <h3 className="font-bold">Description</h3>
                     <p>{channel.bio}</p>
                     <p className="text-muted-foreground pt-4">Joined on {new Date().toLocaleDateString()}</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}


export default function ChannelPage() {
    return <ChannelPageContent />;
}
