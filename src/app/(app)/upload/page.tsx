
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, ChevronLeft, Globe, Lock, Users, ShieldAlert, ImageIcon } from "lucide-react";
import NextImage from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpload } from "@/context/upload-provider";

// Schema without file instances, as we handle files separately
const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(5000).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  audience: z.enum(["kids", "none"]).default("none"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { startUpload, isUploading } = useUpload();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "public",
      audience: "none",
    },
  });

  useEffect(() => {
    // Trigger file input if no video is selected and not uploading
    if (!videoFile && !isUploading) {
      videoInputRef.current?.click();
    }
  }, [videoFile, isUploading]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === 'video') {
      setVideoFile(file);
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);

      const videoElement = document.createElement("video");
      videoElement.src = videoUrl;
      videoElement.onloadedmetadata = () => {
        setVideoDuration(videoElement.duration);
        // Auto-generate thumbnail if one isn't already set
        if (!thumbnailPreview) {
          videoElement.currentTime = 1; 
        }
      };
      videoElement.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext("2d")?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const autoThumbnailUrl = canvas.toDataURL("image/jpeg");
        setThumbnailPreview(autoThumbnailUrl);
        canvas.toBlob(blob => {
          if (blob) {
            setThumbnailFile(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
          }
        }, "image/jpeg");
      };
    } else {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (!user || !user.channel || !videoFile) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and select a video to upload." });
      return;
    }

    const finalThumbnailFile = thumbnailFile; // Use the explicitly set one or the auto-generated one
    if (!finalThumbnailFile) {
      toast({ variant: "destructive", title: "Error", description: "A thumbnail is required." });
      return;
    }
    
    // Start the global upload process
    await startUpload(videoFile, finalThumbnailFile, data, videoDuration);
    
    // The provider now handles notifications and redirects.
    // We can clear the form here.
    form.reset();
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setVideoDuration(0);
  };

  return (
    <>
      <div className={`p-4 max-w-3xl mx-auto ${isUploading ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ChevronLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-bold font-headline">Upload Video</h1>
              <div className="w-10"></div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                  {videoPreview ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                          <video src={videoPreview} className="max-h-full" controls playsInline />
                      </div>
                  ) : (
                    <div 
                      className="relative aspect-video w-full rounded-xl overflow-hidden bg-secondary flex flex-col items-center justify-center cursor-pointer hover:bg-muted"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <UploadCloud className="w-16 h-16 text-muted-foreground"/>
                      <p className="text-muted-foreground mt-2">Tap to select a video file</p>
                    </div>
                  )}
                   <div className="flex gap-4">
                      <div
                          className="relative w-24 h-36 flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                          onClick={() => thumbnailInputRef.current?.click()}
                      >
                          {thumbnailPreview ? (
                          <NextImage src={thumbnailPreview} alt="Thumbnail preview" layout="fill" className="rounded-md object-cover" />
                          ) : (
                          <div className="text-center">
                              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="mt-1 text-xs text-muted-foreground">Add thumbnail</p>
                          </div>
                          )}
                      </div>
                       <div className="flex-1 space-y-2">
                          <FormField control={form.control} name="title" render={({ field }) => (
                              <FormItem>
                              <FormControl><Input placeholder="Title (required)" {...field} className="text-lg border-0 px-0 shadow-none focus-visible:ring-0" /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}/>
                          <FormField control={form.control} name="description" render={({ field }) => (
                              <FormItem>
                                  <FormControl><Textarea placeholder="Add a description" {...field} className="text-base border-0 px-0 shadow-none focus-visible:ring-0 h-24" /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}/>
                       </div>
                  </div>
              </div>

              <FormField control={form.control} name="visibility" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg font-semibold">Visibility</FormLabel>
                     <FormDescription>Choose who can see your video.</FormDescription>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg hover:bg-secondary has-[[data-state=checked]]:bg-secondary">
                           <Globe className="w-6 h-6 text-muted-foreground"/>
                           <div className="flex-1">
                              <FormControl><RadioGroupItem value="public" className="sr-only"/></FormControl>
                              <FormLabel className="font-normal text-base">Public</FormLabel>
                              <FormDescription>Anyone can watch your video</FormDescription>
                           </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg hover:bg-secondary has-[[data-state=checked]]:bg-secondary">
                          <Lock className="w-6 h-6 text-muted-foreground"/>
                          <div className="flex-1">
                              <FormControl><RadioGroupItem value="private" className="sr-only"/></FormControl>
                              <FormLabel className="font-normal text-base">Private</FormLabel>
                              <FormDescription>Only you can watch your video</FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              
              <FormField control={form.control} name="audience" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg font-semibold">Audience</FormLabel>
                     <FormDescription>Is this video made for kids?</FormDescription>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg hover:bg-secondary has-[[data-state=checked]]:bg-secondary">
                           <Users className="w-6 h-6 text-muted-foreground"/>
                           <div className="flex-1">
                              <FormControl><RadioGroupItem value="none" className="sr-only"/></FormControl>
                              <FormLabel className="font-normal text-base">No, it's not made for kids</FormLabel>
                              <FormDescription>Your content will be available to a general audience.</FormDescription>
                           </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg hover:bg-secondary has-[[data-state=checked]]:bg-secondary">
                          <ShieldAlert className="w-6 h-6 text-muted-foreground"/>
                          <div className="flex-1">
                              <FormControl><RadioGroupItem value="kids" className="sr-only"/></FormControl>
                              <FormLabel className="font-normal text-base">Yes, it's made for kids</FormLabel>
                              <FormDescription>Features like comments will be restricted.</FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>

              <Input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
              <Input type="file" accept="image/*" ref={thumbnailInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'thumbnail')} />

              <Button type="submit" size="lg" className="w-full" disabled={!videoPreview || isUploading}>
                Publish
              </Button>
            </form>
          </Form>
      </div>
    </>
  );
}
