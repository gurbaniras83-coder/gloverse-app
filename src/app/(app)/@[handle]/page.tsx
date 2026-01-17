"use client";

import { useParams } from 'next/navigation';
import { mockChannels, mockVideos } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import type { Channel, Video } from '@/lib/types';
import { Loader2, BarChart2, Edit, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatViews } from '@/lib/utils';
import { VideoCard } from '@/components/video-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

function ChannelPageContent() {
    const params = useParams();
    const handleParam = params.handle as string;
    const handle = handleParam.startsWith('@') ? handleParam.substring(1) : handleParam;


    const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
    const [videos, setVideos] = useState<Video[]>([]);
    const [videoCount, setVideoCount] = useState(0);
    
    useEffect(() => {
        // In a real app, you would query Firestore for the channel by handle
        const foundChannel = mockChannels.find(c => c.handle === handle);
        setChannel(foundChannel || null);

        if (foundChannel) {
            const channelVideos = mockVideos.filter(v => v.channel.id === foundChannel.id);
            setVideos(channelVideos);
            setVideoCount(channelVideos.length);
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
                <div>
                    <h2 className="text-2xl font-bold">Channel not found</h2>
                    <p className="text-muted-foreground">The handle @{handle} does not exist.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col">
            {/* Banner */}
            <div className="relative w-full aspect-[3/1] bg-secondary">
                {channel.bannerUrl && (
                     <Image src={channel.bannerUrl} alt={`${channel.fullName} banner`} layout="fill" objectFit="cover" />
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col items-center text-center -mt-12 space-y-2">
                <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={channel.photoURL} alt={channel.handle} />
                    <AvatarFallback className="text-3xl">{channel.handle[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold font-headline">{channel.fullName}</h1>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <span>@{channel.handle}</span>
                        <span>&middot;</span>
                        <span>{formatViews(channel.subscribers)} subscribers</span>
                         <span>&middot;</span>
                        <span>{videoCount} videos</span>
                    </div>
                </div>
                <p className="text-sm max-w-md text-muted-foreground px-4">{channel.bio}</p>
            </div>
            
            {/* Action Bar */}
            <div className="px-4 py-2 flex items-center justify-center gap-2">
                <Button className="flex-1 rounded-full">Subscribe</Button>
                <Button variant="secondary" size="icon" className="rounded-full"><BarChart2 className="h-5 w-5" /></Button>
                <Button variant="secondary" size="icon" className="rounded-full"><Edit className="h-5 w-5" /></Button>
                 <Button variant="secondary" size="icon" className="rounded-full"><MoreVertical className="h-5 w-5" /></Button>
            </div>


            <Tabs defaultValue="videos" className="w-full mt-4">
                <TabsList className="w-full overflow-x-auto no-scrollbar justify-start">
                    <TabsTrigger value="home">Home</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="playlists">Playlists</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>
                 <TabsContent value="home" className="p-4 space-y-6">
                    {videos.length > 0 ? <VideoCard video={videos[0]} /> : <p className="text-center text-muted-foreground py-8">No videos yet.</p>}
                 </TabsContent>
                <TabsContent value="videos" className="p-4 space-y-6">
                    {videos.filter(v => v.type === 'video').map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                    {videos.filter(v => v.type === 'video').length === 0 && <p className="text-center text-muted-foreground py-8">No videos yet.</p>}
                </TabsContent>
                <TabsContent value="shorts" className="p-4">
                     <p className="text-center text-muted-foreground py-8">No shorts yet.</p>
                </TabsContent>
                <TabsContent value="playlists" className="p-4">
                     <p className="text-center text-muted-foreground py-8">No playlists yet.</p>
                </TabsContent>
                 <TabsContent value="about" className="p-4 text-sm space-y-2 text-center text-muted-foreground">
                     <p>{channel.bio}</p>
                     <p className="pt-4">Joined on {new Date().toLocaleDateString()}</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}


export default function ChannelPage() {
    return <ChannelPageContent />;
}
