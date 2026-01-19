
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  uploadTask: XMLHttpRequest | null;
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

const CLOUDINARY_CLOUD_NAME = "doabiexyv";
const CLOUDINARY_UPLOAD_PRESET = "gloverse_upload";
const CLOUDINARY_VIDEO_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
const CLOUDINARY_IMAGE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, transferred: 0, total: 0 });
  const [uploadTask, setUploadTask] = useState<XMLHttpRequest | null>(null);
  const [fileName, setFileName] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  const uploadToCloudinary = (file: File, url: string, onProgress: (event: ProgressEvent) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        setUploadTask(xhr);
        
        xhr.open("POST", url, true);
        
        xhr.upload.onprogress = onProgress;

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(xhr.responseText || `Failed to upload. Status: ${xhr.status}`));
            }
        };
        
        xhr.onerror = () => reject(new Error("Network error occurred during upload."));
        xhr.onabort = () => reject(new Error("Upload aborted."));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        if (url.includes('/video/')) {
          formData.append('resource_type', 'video');
        }
        
        xhr.send(formData);
    });
  }

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
    
    toast({ title: "Upload Started", description: `Your video '${metadata.title}' is now uploading.` });

    try {
      const videoResponse = await uploadToCloudinary(videoFile, CLOUDINARY_VIDEO_URL, (event) => {
         if (event.lengthComputable) {
            setUploadProgress({
                percentage: Math.round((event.loaded / event.total) * 100),
                transferred: event.loaded,
                total: event.total,
            });
         }
      });
      const videoURL = videoResponse.secure_url;
      const actualDuration = videoResponse.duration;

      toast({ title: "Processing...", description: "Uploading thumbnail..."});
      const thumbnailResponse = await uploadToCloudinary(thumbnailFile, CLOUDINARY_IMAGE_URL, () => {});
      const thumbnailURL = thumbnailResponse.secure_url;

      const videoType = actualDuration < 60 ? 'short' : 'long';

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
        duration: actualDuration,
      });

      toast({ title: "Success", description: "Your video has been published!" });
      resetState();
    } catch (error: any) {
      console.error("Upload failed", error);
      const errorMessage = error.message || "An unknown error occurred during upload.";
      toast({ variant: "destructive", title: "Upload Failed", description: errorMessage });
      resetState();
    }
  };

  const cancelUpload = () => {
    if (uploadTask) {
      uploadTask.abort();
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
