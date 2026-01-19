"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, Settings, BarChart2, ChevronRight, History, FolderClock, ThumbsUp, Users, School, Shield } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { VideoCard } from "@/components/video-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Video } from "@/lib/types";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

export default function YouPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [historyVideos, setHistoryVideos] = useState<Video[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      // In a real history implementation, you'd fetch videos the user has watched.
      // For this demo, we'll just fetch some recent videos to populate the UI.
      const fetchRecentVideos = async () => {
        setPageLoading(true);
        try {
          const videosQuery = query(
            collection(db, "videos"), 
            where("visibility", "==", "public"),
            orderBy("createdAt", "desc"), 
            limit(5)
          );
          const snapshot = await getDocs(videosQuery);
          const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
          setHistoryVideos(videos);
        } catch (error) {
          console.error("Error fetching recent videos for history:", error);
        } finally {
          setPageLoading(false);
        }
      };
      fetchRecentVideos();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
    }
  };

  if (loading || pageLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user.channel) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div>
          <p className="mb-4">Setting up your channel...</p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8">
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

       <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
            <Button variant="secondary" className="rounded-full flex-shrink-0"><Users className="mr-2"/>Switch account</Button>
            <Button variant="secondary" className="rounded-full flex-shrink-0"><School className="mr-2"/>Google Account</Button>
            <Button variant="secondary" className="rounded-full flex-shrink-0"><Shield className="mr-2"/>Turn on Incognito</Button>
        </div>
      </div>

      <Separator />

      {historyVideos.length > 0 && (
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
                    {/* In a real app, you would fetch the count of liked videos */}
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
        <Button variant="ghost" className="w-full justify-start gap-3">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
