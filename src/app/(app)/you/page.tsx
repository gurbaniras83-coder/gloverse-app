"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, Settings, BarChart2, ChevronRight, History, FolderClock, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { VideoCard } from "@/components/video-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Video } from "@/lib/types";
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from "firebase/firestore";

export default function YouPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [historyVideos, setHistoryVideos] = useState<Video[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to resolve
    }
    
    if (!user) {
      setPageLoading(false); // If no user, stop loading and show login prompt
      return;
    }

    const fetchHistory = async () => {
      setPageLoading(true);
      try {
        const historyQuery = query(
          collection(db, "users", user.uid, "history"), 
          orderBy("watchedAt", "desc"), 
          limit(10)
        );
        const historySnapshot = await getDocs(historyQuery);
        
        if (historySnapshot.empty) {
          setHistoryVideos([]);
          return;
        }

        const videoPromises = historySnapshot.docs.map(async (historyDoc) => {
          const videoId = historyDoc.data().videoId;
          if (!videoId) return null;
          
          const videoRef = doc(db, "videos", videoId);
          const videoSnap = await getDoc(videoRef);

          if (!videoSnap.exists()) return null;

          const videoData = videoSnap.data();
          const channelRef = doc(db, "channels", videoData.channelId);
          const channelSnap = await getDoc(channelRef);

          return { 
            ...videoData, 
            id: videoSnap.id, 
            createdAt: videoData.createdAt?.toDate(),
            channel: channelSnap.exists() ? { id: channelSnap.id, ...channelSnap.data() } : null
          } as Video;
        });

        const videos = (await Promise.all(videoPromises)).filter((v): v is Video => v !== null && v.channel !== null);
        setHistoryVideos(videos);

      } catch (error) {
        console.error("Error fetching history:", error);
        toast({ variant: "destructive", title: "Could not load history." });
        setHistoryVideos([]);
      } finally {
        setPageLoading(false);
      }
    };

    fetchHistory();

  }, [user, authLoading, toast]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
    }
  };
  
  if (authLoading || (pageLoading && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-4">
         <p className="mb-4 text-lg">See your profile and activity.</p>
         <Button asChild>
            <Link href="/login">Log In</Link>
         </Button>
      </div>
    );
  }
  
  if (!user.channel) {
    // This case can happen briefly while the channel is being created after signup
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div>
          <p className="mb-4">Finalizing your channel setup...</p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.channel.photoURL} alt={user.channel.handle} />
          <AvatarFallback className="text-3xl">
            {user.channel.handle.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold font-headline">{user.channel.fullName}</h1>
          <p className="text-muted-foreground">@{user.channel.handle}</p>
           <Link href={`/@${user.channel.handle}`} className="text-sm text-blue-400 hover:underline flex items-center">
            View channel <ChevronRight className="w-4 h-4 ml-1" />
           </Link>
        </div>
      </div>

      <Separator />

      {historyVideos.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><History /> History</h2>
              <Link href="#" className="text-sm text-blue-400">View all</Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                  {historyVideos.map(video => (
                      <div key={`history-${video.id}`} className="w-64">
                          <VideoCard video={video} />
                      </div>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ) : (
        !pageLoading && <p className="text-center text-muted-foreground py-8">Your watch history will appear here.</p>
      )}

      <Separator />

      <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2"><FolderClock /> Playlists</h2>
            <Link href="#" className="text-sm text-blue-400">View all</Link>
        </div>
        <div className="space-y-4">
            <div className="flex items-center gap-4 hover:bg-secondary/50 p-2 rounded-lg cursor-pointer">
                <div className="w-24 h-16 bg-secondary rounded-lg flex items-center justify-center">
                    <ThumbsUp />
                </div>
                <div className="flex-1">
                    <p className="font-semibold">Liked videos</p>
                    <p className="text-sm text-muted-foreground">Playlist</p>
                </div>
                <ChevronRight className="text-muted-foreground"/>
            </div>
        </div>
      </div>
      
      <Separator />

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
          <Link href="/studio">
            <BarChart2 className="h-5 w-5 text-primary" />
            Gloverse Studio
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
            <Link href="/studio/customize">
                <Settings className="h-5 w-5 text-primary" />
                Settings
            </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
