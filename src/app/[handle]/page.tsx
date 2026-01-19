"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import type { Channel, Video } from '@/lib/types';
import { Loader2, BarChart2, Edit, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatViews } from '@/lib/utils';
import { VideoCard } from '@/components/video-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '@/context/auth-provider';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { ShortsShelf } from '@/components/shorts-shelf';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';

function ChannelPageContent() {
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const handleParam = params.handle ? decodeURIComponent(params.handle as string) : "";
    const handle = handleParam.startsWith('@') ? handleParam.substring(1) : handleParam;

    const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    
    const [joinedDate, setJoinedDate] = useState('');

    const fetchChannelData = useCallback(async () => {
        if (!handle) return;
        setChannel(undefined);
        try {
            const channelQuery = query(collection(db, "channels"), where("handle", "==", handle));
            const channelSnapshot = await getDocs(channelQuery);

            if (channelSnapshot.empty) {
                setChannel(null);
                return;
            }

            const channelDoc = channelSnapshot.docs[0];
            const channelData = { id: channelDoc.id, ...channelDoc.data() } as Channel;
            
            if (channelData.createdAt) {
                if (typeof (channelData.createdAt as any).toDate === 'function') {
                    setJoinedDate((channelData.createdAt as any).toDate().toLocaleDateString());
                } else if (typeof channelData.createdAt === 'string') {
                    setJoinedDate(new Date(channelData.createdAt).toLocaleDateString());
                }
            }
            
            if (user?.channel?.id === channelData.id) {
                setIsOwner(true);
            }

            const videosQuery = query(collection(db, "videos"), where("channelId", "==", channelData.id), where("visibility", "==", "public"));
            const videosSnapshot = await getDocs(videosQuery);
            const videosData = videosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                channel: channelData,
            })) as Video[];
            setVideos(videosData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            
            setChannel(channelData);

            if (user && user.channel?.id !== channelData.id) {
                const subDocRef = doc(db, "users", user.uid, "subscriptions", channelData.id);
                const subDoc = await getDoc(subDocRef);
                setIsSubscribed(subDoc.exists());
            }

        } catch (error) {
            console.error("Error fetching channel data:", error);
            setChannel(null);
        }
    }, [handle, user]);

    useEffect(() => {
        if (!authLoading) {
            fetchChannelData();
        }
    }, [handle, authLoading, fetchChannelData]);

    const handleSubscribeToggle = async () => {
        if (!user || !channel || isOwner || isSubscribing) {
            if(!user) toast({ variant: 'destructive', title: 'You must be logged in to subscribe.' });
            return;
        };
        
        setIsSubscribing(true);
        const subRef = doc(db, "users", user.uid, "subscriptions", channel.id);
        const channelRef = doc(db, "channels", channel.id);

        try {
            const batch = writeBatch(db);
            const isCurrentlySubscribed = (await getDoc(subRef)).exists();

            if (isCurrentlySubscribed) {
                batch.delete(subRef);
                batch.update(channelRef, { subscribers: increment(-1) });
                setChannel(prev => prev ? {...prev, subscribers: Math.max(0, prev.subscribers - 1)} : null);
                setIsSubscribed(false);
            } else {
                batch.set(subRef, { subscribedAt: new Date() });
                batch.update(channelRef, { subscribers: increment(1) });
                setChannel(prev => prev ? {...prev, subscribers: prev.subscribers + 1} : null);
                setIsSubscribed(true);
            }
            await batch.commit();
        } catch (error) {
            console.error("Subscription error:", error);
            toast({ variant: "destructive", title: "Could not update subscription." });
        } finally {
            setIsSubscribing(false);
        }
    };

    if (channel === undefined || authLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (channel === null) {
        return (
            <div className="flex h-96 items-center justify-center p-4 text-center">
                <div>
                    <h2 className="text-2xl font-bold">This channel doesn’t exist.</h2>
                    <p className="text-muted-foreground">Try searching for something else.</p>
                </div>
            </div>
        );
    }
    
    const longVideos = videos.filter(v => v.type === 'long');
    const shorts = videos.filter(v => v.type === 'short');
    
    return (
        <div className="flex flex-col">
            <div className="relative w-full aspect-[3/1] bg-secondary">
                {channel.bannerUrl && ( <Image src={channel.bannerUrl} alt={`${channel.fullName} banner`} fill style={{objectFit:"cover"}} /> )}
            </div>

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
                        <span>{videos.length} videos</span>
                    </div>
                </div>
                <p className="text-sm max-w-md text-muted-foreground px-4">{channel.bio}</p>
            </div>
            
            <div className="px-4 py-2 flex items-center justify-center gap-2">
                {isOwner ? (
                    <>
                        <Button asChild className="flex-1 rounded-full"><Link href="/studio">Manage videos</Link></Button>
                        <Button asChild variant="secondary" size="icon" className="rounded-full"><Link href="/studio"><BarChart2 className="h-5 w-5" /></Link></Button>
                        <Button asChild variant="secondary" size="icon" className="rounded-full"><Link href="/studio/customize"><Edit className="h-5 w-5" /></Link></Button>
                    </>
                ) : (
                    <Button onClick={handleSubscribeToggle} disabled={!user || isSubscribing} className="flex-1 rounded-full" variant={isSubscribed ? 'secondary' : 'default'}>
                        {isSubscribed && <Bell className="mr-2 h-4 w-4" />}
                        {isSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                )}
            </div>

            <Tabs defaultValue="home" className="w-full mt-4">
                <TabsList className="w-full overflow-x-auto no-scrollbar justify-start px-4">
                    <TabsTrigger value="home">Home</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="playlists">Playlists</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>
                 <TabsContent value="home" className="p-4 space-y-6">
                    {longVideos.length > 0 && (
                        <div className='space-y-6'>
                            <h2 className="text-xl font-bold">Videos</h2>
                            <VideoCard video={longVideos[0]} />
                        </div>
                    )}
                    {shorts.length > 0 && <ShortsShelf shorts={shorts} />}
                    {longVideos.length > 1 && (
                         <div className="flex flex-col space-y-6 pt-6">
                            <h2 className="text-xl font-bold">Recent Uploads</h2>
                            {longVideos.slice(1).map((video, index) => (
                                <React.Fragment key={`recent-${video.id}`}>
                                <VideoCard video={video} />
                                {index < longVideos.slice(1).length -1 && <Separator className="my-2" />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                     {videos.length === 0 && <p className="text-center text-muted-foreground py-8">This channel hasn't posted any videos yet.</p>}
                 </TabsContent>
                <TabsContent value="videos" className="p-4 space-y-6">
                    {longVideos.map(video => <VideoCard key={video.id} video={video} />)}
                    {longVideos.length === 0 && <p className="text-center text-muted-foreground py-8">No long-form videos yet.</p>}
                </TabsContent>
                <TabsContent value="shorts" className="p-4">
                     {shorts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {shorts.map(short => (
                                 <Link href={`/shorts#${short.id}`} key={short.id} className="relative aspect-[9/16] rounded-lg overflow-hidden group bg-secondary">
                                     {short.thumbnailUrl && <Image src={short.thumbnailUrl} alt={short.title} fill style={{objectFit:"cover"}} />}
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                     <div className="absolute bottom-0 left-0 p-2 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
                                        <p className="text-sm font-semibold truncate">{short.title}</p>
                                        <p className="text-xs">{formatViews(short.views)} views</p>
                                     </div>
                                 </Link>
                            ))}
                        </div>
                     ) : <p className="text-center text-muted-foreground py-8">No shorts yet.</p>}
                </TabsContent>
                <TabsContent value="playlists" className="p-4">
                     <p className="text-center text-muted-foreground py-8">This channel has no playlists.</p>
                </TabsContent>
                 <TabsContent value="about" className="p-4 text-sm space-y-2 text-center text-muted-foreground">
                     <p>{channel.bio}</p>
                     <p className="text-xs">
                        Information
                     </p>
                     {joinedDate && <p className="pt-4">Joined on {joinedDate}</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ChannelRoutePage() {
    return (
        <div className="relative mx-auto flex min-h-screen w-full max-w-[500px] flex-col bg-background">
          <main className="flex-1 pb-16"><ChannelPageContent /></main>
          <BottomNav />
        </div>
      );
}
