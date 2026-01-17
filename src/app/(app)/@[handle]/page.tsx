"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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

function ChannelPageContent() {
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const handleParam = params.handle as string;
    const handle = handleParam ? (handleParam.startsWith('@') ? handleParam.substring(1) : handleParam) : "";

    const [channel, setChannel] = useState<Channel | null | undefined>(undefined);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    
    const [joinedDate, setJoinedDate] = useState('');

    useEffect(() => {
        const fetchChannelData = async () => {
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
                    // Check if createdAt is a Firestore Timestamp
                    if (typeof (channelData.createdAt as any).toDate === 'function') {
                      setJoinedDate((channelData.createdAt as any).toDate().toLocaleDateString());
                    } else if (typeof channelData.createdAt === 'string') {
                      setJoinedDate(new Date(channelData.createdAt).toLocaleDateString());
                    }
                }

                if (user?.uid === channelData.id) {
                    setIsOwner(true);
                }

                const videosQuery = query(collection(db, "videos"), where("channelId", "==", channelData.id), where("visibility", "==", "public"));
                const videosSnapshot = await getDocs(videosQuery);
                const videosData = videosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                    channel: channelData, // Attach channel data to each video
                })) as Video[];
                setVideos(videosData);
                
                // Set channel after videos are loaded with channel data attached
                setChannel(channelData);

                if (user && user.uid !== channelData.id) {
                    const subDocRef = doc(db, "users", user.uid, "subscriptions", channelData.id);
                    const subDoc = await getDoc(subDocRef);
                    setIsSubscribed(subDoc.exists());
                }

            } catch (error) {
                console.error("Error fetching channel data:", error);
                setChannel(null);
            }
        };

        if (!authLoading && handle) {
            fetchChannelData();
        }
    }, [handle, user, authLoading]);

    const handleSubscribeToggle = async () => {
        if (!user || !channel || isOwner || isSubscribing) {
            if(!user) toast({ variant: 'destructive', title: 'You must be logged in to subscribe.' });
            return
        };
        
        setIsSubscribing(true);
        const subRef = doc(db, "users", user.uid, "subscriptions", channel.id);
        const channelRef = doc(db, "channels", channel.id);

        try {
            const batch = writeBatch(db);
            if (isSubscribed) {
                batch.delete(subRef);
                batch.update(channelRef, { subscribers: increment(-1) });
                setChannel(prev => prev ? {...prev, subscribers: prev.subscribers - 1} : null);
            } else {
                batch.set(subRef, { subscribedAt: new Date() });
                batch.update(channelRef, { subscribers: increment(1) });
                setChannel(prev => prev ? {...prev, subscribers: prev.subscribers + 1} : null);
            }
            await batch.commit();
            setIsSubscribed(!isSubscribed);
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
                    <h2 className="text-2xl font-bold">Channel not found</h2>
                    <p className="text-muted-foreground">The handle @{handle} does not exist.</p>
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
                        <Button className="flex-1 rounded-full">Manage videos</Button>
                        <Button variant="secondary" size="icon" className="rounded-full"><BarChart2 className="h-5 w-5" /></Button>
                        <Button variant="secondary" size="icon" className="rounded-full"><Edit className="h-5 w-5" /></Button>
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
                    {videos.length > 0 ? <VideoCard video={videos[0]} /> : <p className="text-center text-muted-foreground py-8">This channel hasn't posted any videos yet.</p>}
                 </TabsContent>
                <TabsContent value="videos" className="p-4 space-y-6">
                    {longVideos.map(video => <VideoCard key={video.id} video={video} />)}
                    {longVideos.length === 0 && <p className="text-center text-muted-foreground py-8">No long-form videos yet.</p>}
                </TabsContent>
                <TabsContent value="shorts" className="p-4">
                     {shorts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {shorts.map(short => (
                                 <div key={short.id} className="relative aspect-[9/16] rounded-lg overflow-hidden">
                                     <Image src={short.thumbnailUrl} alt={short.title} fill style={{objectFit:"cover"}} />
                                 </div>
                            ))}
                        </div>
                     ) : <p className="text-center text-muted-foreground py-8">No shorts yet.</p>}
                </TabsContent>
                <TabsContent value="playlists" className="p-4">
                     <p className="text-center text-muted-foreground py-8">No playlists yet.</p>
                </TabsContent>
                 <TabsContent value="about" className="p-4 text-sm space-y-2 text-center text-muted-foreground">
                     <p>{channel.bio}</p>
                     {joinedDate && <p className="pt-4">Joined on {joinedDate}</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ChannelPage() {
    return <ChannelPageContent />;
}
