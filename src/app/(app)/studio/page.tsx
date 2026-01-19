"use client";

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2, Users, Clock, ThumbsUp, Video as VideoIcon, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Video } from "@/lib/types";
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { formatViews } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const editVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(5000).optional(),
});
type EditVideoFormValues = z.infer<typeof editVideoSchema>;

export default function StudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

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
        setTotalViews(views);
        setTotalLikes(likes);

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
  }

  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
  }

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
  }

  const onDeleteConfirm = async () => {
    if (!selectedVideo) return;
    setIsDeleting(true);
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, "videos", selectedVideo.id));
      
      // Delete files from Storage
      const deleteFileFromURL = async (url: string) => {
        if(!url.includes('firebasestorage')) return; // Not a storage URL
        const filePath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
      await deleteFileFromURL(selectedVideo.videoUrl);
      if (selectedVideo.thumbnailUrl) {
        await deleteFileFromURL(selectedVideo.thumbnailUrl);
      }

      setVideos(prev => prev.filter(v => v.id !== selectedVideo.id));
      toast({ title: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({ variant: "destructive", title: "Error deleting video", description: "Could not delete video files from storage." });
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

  const latestVideo = videos[0];

  return (
    <>
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Gloverse Studio</h1>
          <Button asChild variant="outline">
            <Link href={`/@${user.channel.handle}`}>View Channel</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Channel Analytics</CardTitle>
            <CardDescription>Current stats for your channel.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-secondary rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary"/>
              <p className="text-2xl font-bold">{formatViews(user.channel.subscribers)}</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary"/>
              <p className="text-2xl font-bold">{formatViews(totalViews)}</p>
              <p className="text-sm text-muted-foreground">Views</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <VideoIcon className="w-6 h-6 mx-auto mb-2 text-primary"/>
              <p className="text-2xl font-bold">{videos.length}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-primary"/>
              <p className="text-2xl font-bold">{formatViews(totalLikes)}</p>
              <p className="text-sm text-muted-foreground">Likes</p>
            </div>
          </CardContent>
        </Card>
        
        {latestVideo && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Video Performance</CardTitle>
              <CardDescription>Stats for your newest video.</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoCard video={latestVideo} />
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Videos</h2>
            <Button asChild variant="default" size="sm">
              <Link href="/upload">Upload New</Link>
            </Button>
          </div>
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map(video => (
                <div key={video.id} className="p-2 rounded-lg hover:bg-secondary">
                  <VideoCard video={video} />
                  <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(video)}><Edit className="w-4 h-4 mr-2"/> Edit</Button>
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteClick(video)}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You haven't uploaded any videos yet.</p>
          )}
        </div>
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
              This action cannot be undone. This will permanently delete your video
              and all its data from our servers.
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
