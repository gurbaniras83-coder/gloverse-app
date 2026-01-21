'use client';
export const dynamic = 'force-dynamic';

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2, Users, Eye, ThumbsUp, Video as VideoIcon, Edit, Trash2, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Video } from "@/lib/types";
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatViews } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ViewsChart } from "@/components/analytics/views-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const editVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(5000).optional(),
});
type EditVideoFormValues = z.infer<typeof editVideoSchema>;

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
    <div className="p-4 bg-secondary rounded-lg">
        <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <Icon className="w-5 h-5 text-muted-foreground"/>
        </div>
        <p className="text-3xl font-bold">{value}</p>
    </div>
);

export default function StudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const form = useForm<EditVideoFormValues>({
    resolver: zodResolver(editVideoSchema),
  });

  useEffect(() => {
    if (loading) return;
    if (!user || !user.channel) {
      router.replace("/login");
      return;
    }

    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const videosQuery = query(
          collection(db, "videos"),
          where("channelId", "==", user.channel!.id),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(videosQuery);
        const userVideos = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
          channel: user.channel,
        })) as Video[];

        setVideos(userVideos);
        
        const views = userVideos.reduce((acc, video) => acc + (video.views || 0), 0);
        const likes = userVideos.reduce((acc, video) => acc + (video.likes || 0), 0);
        const watchTime = userVideos.reduce((acc, video) => {
            const durationInSeconds = typeof video.duration === 'number' ? video.duration : 0;
            if (video.type === 'long') {
                return acc + ((video.views || 0) * durationInSeconds);
            }
            return acc;
        }, 0) / 3600; // in hours
        
        setTotalViews(views);
        setTotalLikes(likes);
        setTotalWatchTime(watchTime);

      } catch (error) {
        console.error("Error fetching user videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [user, loading, router]);

  const handleEditClick = (video: Video) => {
    setSelectedVideo(video);
    form.reset({ title: video.title, description: video.description });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
  };

  const onEditSubmit = async (data: EditVideoFormValues) => {
    if (!selectedVideo) return;
    setIsEditing(true);
    try {
        const videoRef = doc(db, "videos", selectedVideo.id);
        await updateDoc(videoRef, {
            title: data.title,
            description: data.description,
        });
        setVideos(prev => prev.map(v => v.id === selectedVideo.id ? {...v, ...data} : v));
        toast({ title: "Video updated!" });
        setIsEditDialogOpen(false);
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "Failed to update video." });
    } finally {
        setIsEditing(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedVideo) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "videos", selectedVideo.id));
      setVideos(prev => prev.filter(v => v.id !== selectedVideo.id));
      toast({ title: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({ variant: "destructive", title: "Error deleting video", description: "Could not delete video from database." });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedVideo(null);
    }
  };

  if (loading || isLoading || !user?.channel) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const latestVideo = videos.length > 0 ? videos[0] : null;

  return (
    <>
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Gloverse Studio</h1>
           <Button asChild variant="outline" size="sm">
            <Link href={`/@${user.channel.handle}`}>View Channel</Link>
          </Button>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Channel Analytics</CardTitle>
                    <CardDescription>A summary of your channel's performance.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <StatCard title="Subscribers" value={formatViews(user.channel.subscribers)} icon={Users} />
                    <StatCard title="Views" value={formatViews(totalViews)} icon={Eye} />
                    <StatCard title="Watch Time (h)" value={totalWatchTime.toFixed(1)} icon={Loader2}/>
                    <StatCard title="Likes" value={formatViews(totalLikes)} icon={ThumbsUp} />
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="w-6 h-6"/> Monetization</CardTitle>
                        <CardDescription>Track your progress towards monetization eligibility.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Subscribers</span>
                                <span>{formatViews(user.channel.subscribers)} / 300</span>
                            </div>
                            <Progress value={(user.channel.subscribers / 300) * 100} className="h-2"/>
                            <p className="text-xs text-muted-foreground">300 subscribers required.</p>
                        </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Public watch hours (longs)</span>
                                <span>{totalWatchTime.toFixed(1)} / 500</span>
                            </div>
                            <Progress value={(totalWatchTime / 500) * 100} className="h-2"/>
                            <p className="text-xs text-muted-foreground">500 valid public watch hours required. This is an estimate based on views and video duration.</p>
                        </div>
                    </CardContent>
                </Card>

                <ViewsChart />
                
                {latestVideo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Video Performance</CardTitle>
                      <CardDescription>Stats for your newest upload.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-2 rounded-lg bg-secondary border">
                        <div className="flex items-center gap-4">
                          <img src={latestVideo.thumbnailUrl} alt={latestVideo.title} className="w-24 aspect-video rounded-md object-cover" />
                          <div className="flex-1">
                            <p className="font-semibold line-clamp-2">{latestVideo.title}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                              <span className="flex items-center gap-1"><Eye className="w-4 h-4"/> {formatViews(latestVideo.views)}</span>
                              <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4"/> {formatViews(latestVideo.likes)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                       <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(latestVideo)}><Edit className="w-4 h-4 mr-2"/> Edit</Button>
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteClick(latestVideo)}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                        </div>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
            <TabsContent value="content" className="space-y-4 mt-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Manage Content</h2>
                    <Button asChild variant="default" size="sm">
                      <Link href="/upload">Upload New</Link>
                    </Button>
                  </div>
                   {videos.length > 0 ? (
                    <div className="space-y-4">
                      {videos.map(video => (
                        <div key={video.id} className="p-2 rounded-lg bg-card border">
                          <div className="flex items-center gap-4">
                            <img src={video.thumbnailUrl} alt={video.title} className="w-24 aspect-video rounded-md object-cover" />
                            <div className="flex-1">
                                <p className="font-semibold line-clamp-2">{video.title}</p>
                                <p className="text-xs text-muted-foreground">{new Date(video.createdAt).toLocaleDateString()}</p>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1"><Eye className="w-4 h-4"/> {formatViews(video.views)}</span>
                                <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4"/> {formatViews(video.likes)}</span>
                                </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                              <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(video)}><Edit className="w-4 h-4 mr-2"/> Edit</Button>
                              <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteClick(video)}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl">
                        <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground"/>
                        <h3 className="mt-4 text-lg font-semibold">No content available</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Get started by uploading a video.</p>
                        <Button asChild className="mt-4">
                            <Link href="/upload">Upload video</Link>
                        </Button>
                    </div>
                  )}
            </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Video</DialogTitle>
                <DialogDescription>Make changes to your video's details.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea {...field} className="h-32" /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isEditing}>{isEditing && <Loader2 className="animate-spin mr-2"/>}Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your video's
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
