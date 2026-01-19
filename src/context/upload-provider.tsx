
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "./auth-provider";
import { useToast } from "@/hooks/use-toast";

type UploadProgress = {
  percentage: number;
  transferred: number;
  total: number;
};

interface UploadContextType {
  isUploading: boolean;
  uploadProgress: UploadProgress;
  uploadTask: UploadTask | null;
  fileName: string;
  thumbnailPreview: string | null;
  startUpload: (
    videoFile: File,
    thumbnailFile: File,
    metadata: { title: string; description?: string; visibility: "public" | "private"; audience: "kids" | "none" },
    videoDuration: number
  ) => Promise<void>;
  cancelUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, transferred: 0, total: 0 });
  const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);
  const [fileName, setFileName] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  const startUpload = async (
    videoFile: File,
    thumbnailFile: File,
    metadata: { title: string; description?: string; visibility: "public" | "private"; audience: "kids" | "none" },
    videoDuration: number
  ) => {
    if (!user || !user.channel) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to upload." });
      return;
    }
    
    setIsUploading(true);
    setFileName(metadata.title);
    setThumbnailPreview(URL.createObjectURL(thumbnailFile));
    
    if (Notification.permission === "granted") {
        new Notification("Upload Started", {
            body: `Your video '${metadata.title}' is now uploading.`,
            icon: URL.createObjectURL(thumbnailFile)
        });
    }

    const uploadFile = (file: File, path: string): UploadTask => {
      const storageRef = ref(storage, path);
      return uploadBytesResumable(storageRef, file);
    };

    try {
      const videoFileName = `${user.uid}/${Date.now()}-${videoFile.name}`;
      const videoUploadTask = uploadFile(videoFile, `videos/${videoFileName}`);
      setUploadTask(videoUploadTask);

      videoUploadTask.on(
        "state_changed",
        (snapshot) => {
          setUploadProgress({
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            transferred: snapshot.bytesTransferred,
            total: snapshot.totalBytes,
          });
        },
        (error) => {
          console.error("Upload failed", error);
          toast({ variant: "destructive", title: "Upload Failed", description: error.message });
          if (Notification.permission === "granted") {
            new Notification("Upload Failed", { body: `Could not upload '${metadata.title}'.` });
          }
          resetState();
        },
        async () => {
          const videoURL = await getDownloadURL(videoUploadTask.snapshot.ref);
          
          // Now upload thumbnail
          const thumbnailFileName = `${user.uid}/${Date.now()}-thumbnail.jpg`;
          const thumbnailUploadTask = uploadFile(thumbnailFile, `thumbnails/${thumbnailFileName}`);
          
          thumbnailUploadTask.on( "state_changed", () => {}, (error) => { throw error }, 
            async () => {
              const thumbnailURL = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
              const videoType = videoDuration < 60 ? 'short' : 'long';

              await addDoc(collection(db, "videos"), {
                uid: user.uid,
                channelId: user.channel!.id,
                title: metadata.title,
                description: metadata.description,
                videoUrl: videoURL,
                thumbnailUrl: thumbnailURL,
                type: videoType,
                visibility: metadata.visibility,
                audience: metadata.audience,
                views: 0,
                likes: 0,
                createdAt: serverTimestamp(),
                duration: videoDuration,
              });

              toast({ title: "Success", description: "Your video has been published!" });
              if (Notification.permission === "granted") {
                new Notification("Upload Complete!", {
                  body: `'${metadata.title}' has been published.`,
                  icon: thumbnailURL
                });
              }
              resetState();
            }
          );
        }
      );
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      if (Notification.permission === "granted") {
        new Notification("Upload Failed", { body: `Could not upload '${metadata.title}'.` });
      }
      resetState();
    }
  };

  const cancelUpload = () => {
    if (uploadTask) {
      uploadTask.cancel();
      toast({ title: "Upload Cancelled" });
    }
    resetState();
  };
  
  const resetState = () => {
      setIsUploading(false);
      setUploadProgress({ percentage: 0, transferred: 0, total: 0 });
      setUploadTask(null);
      setFileName("");
      setThumbnailPreview(null);
  }

  return (
    <UploadContext.Provider value={{ isUploading, uploadProgress, uploadTask, fileName, thumbnailPreview, startUpload, cancelUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};
