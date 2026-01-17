"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Image as ImageIcon, UploadCloud } from "lucide-react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import Image from "next/image";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(5000).optional(),
  videoFile: z.instanceof(File).refine(file => file.size > 0, 'Video file is required.'),
  thumbnailFile: z.instanceof(File).optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("videoFile", file);
      setVideoPreview(URL.createObjectURL(file));
      if (!thumbnailPreview) {
        // Auto-thumbnail generation
        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(file);
        videoElement.onloadeddata = () => {
          videoElement.currentTime = 1; // Capture frame at 1 second
        };
        videoElement.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          canvas.getContext("2d")?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          setThumbnailPreview(canvas.toDataURL("image/jpeg"));
          canvas.toBlob(blob => {
            if (blob) {
              form.setValue("thumbnailFile", new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
            }
          }, "image/jpeg");
        };
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("thumbnailFile", file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };


  const onSubmit = async (data: UploadFormValues) => {
    if (!user || !data.videoFile) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and select a video to upload." });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    const uploadFile = (file: File, path: string) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => reject(error),
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    try {
      const videoFileName = `${user.uid}/${Date.now()}-${data.videoFile.name}`;
      const videoURL = await uploadFile(data.videoFile, `videos/${videoFileName}`);
      
      let thumbnailURL = "";
      if (data.thumbnailFile) {
        const thumbnailFileName = `${user.uid}/${Date.now()}-thumbnail.jpg`;
        thumbnailURL = await uploadFile(data.thumbnailFile, `thumbnails/${thumbnailFileName}`);
      } else if(thumbnailPreview) {
        // Upload auto-generated thumbnail
        const blob = await (await fetch(thumbnailPreview)).blob();
        const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
        const thumbnailFileName = `${user.uid}/${Date.now()}-thumbnail.jpg`;
        thumbnailURL = await uploadFile(thumbnailFile, `thumbnails/${thumbnailFileName}`);
      }
      
      await addDoc(collection(db, "videos"), {
        uid: user.uid,
        title: data.title,
        description: data.description,
        videoUrl: videoURL,
        thumbnailUrl: thumbnailURL,
        type: data.videoFile.duration > 60 ? 'video' : 'short', // Simplified logic
        views: 0,
        likes: [],
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Your video has been published!" });
      router.push(`/@${user.channel?.handle}`);
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold font-headline mb-4">Upload Video</h1>
      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="w-16 h-16 text-primary" />
            <p className="text-lg font-semibold">Uploading...</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Upload */}
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                onClick={() => videoInputRef.current?.click()}
              >
                {videoPreview ? (
                  <video src={videoPreview} className="w-full rounded-md" controls />
                ) : (
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Click to upload video</p>
                  </div>
                )}
                <Input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={handleVideoFileChange} />
              </div>
              
              {/* Thumbnail Upload */}
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <Image src={thumbnailPreview} alt="Thumbnail preview" width={1920} height={1080} className="w-full rounded-md object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Click to upload thumbnail</p>
                  </div>
                )}
                <Input type="file" accept="image/*" ref={thumbnailInputRef} className="hidden" onChange={handleThumbnailFileChange} />
              </div>
            </div>

            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="My awesome video" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="A description of my video..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <Button type="submit" className="w-full">
              Publish
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
