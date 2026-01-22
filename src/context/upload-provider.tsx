
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const CLOUDINARY_CLOUD_NAME = "doabiexyv";
const CLOUDINARY_UPLOAD_PRESET = "gloverse_upload";
const CLOUDINARY_VIDEO_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
const CLOUDINARY_IMAGE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface UploadProgress {
    percentage: number;
    transferred: number;
    total: number;
}

interface UploadContextType {
    isUploading: boolean;
    uploadProgress: UploadProgress;
    fileName: string;
    thumbnailPreview: string | null;
    startUpload: (videoFile: File, thumbnailFile: File, metadata: any, videoDuration: number) => Promise<void>;
    cancelUpload: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, transferred: 0, total: 0 });
    const [fileName, setFileName] = useState("");
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [uploadTask, setUploadTask] = useState<XMLHttpRequest | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const uploadFile = (file: File, url: string, isVideo: boolean) => {
        return new Promise<{ secure_url: string, duration?: number }>((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const xhr = new XMLHttpRequest();
            if (isVideo) {
                setUploadTask(xhr);
            }

            xhr.open('POST', url, true);
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && isVideo) {
                    const percentage = (event.loaded / event.total) * 100;
                    setUploadProgress({
                        percentage: percentage,
                        transferred: event.loaded,
                        total: event.total
                    });
                }
            };
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.secure_url) {
                        resolve(response);
                    } else {
                        reject(new Error(`Cloudinary error: ${response.error?.message || 'Upload failed'}`));
                    }
                } else {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        reject(new Error(`Cloudinary error: ${response.error?.message || xhr.statusText}`));
                    } catch {
                         reject(new Error(`Cloudinary error: ${xhr.statusText}`));
                    }
                }
                 if (isVideo) setUploadTask(null);
            };
            
            xhr.onerror = () => {
                reject(new Error('Network error during upload.'));
                if (isVideo) setUploadTask(null);
            };

            xhr.send(formData);
        });
    };

    const cancelUpload = () => {
        if (uploadTask) {
            uploadTask.abort();
            setIsUploading(false);
            setUploadProgress({ percentage: 0, transferred: 0, total: 0 });
            setFileName("");
            setThumbnailPreview(null);
            setUploadTask(null);
            toast({ title: "Upload Canceled" });
        }
    };

    const startUpload = async (videoFile: File, thumbnailFile: File, metadata: any, videoDuration: number) => {
        if (!user || !user.channel) {
            toast({ variant: 'destructive', title: 'You must be logged in to upload.' });
            return;
        }

        setIsUploading(true);
        setFileName(videoFile.name);
        setThumbnailPreview(URL.createObjectURL(thumbnailFile));
        setUploadProgress({ percentage: 0, transferred: 0, total: 0 });

        try {
            toast({ title: "Uploading thumbnail..." });
            const thumbnailResponse = await uploadFile(thumbnailFile, CLOUDINARY_IMAGE_URL, false);
            const thumbnailUrl = thumbnailResponse.secure_url;

            toast({ title: "Uploading video..." });
            const videoResponse = await uploadFile(videoFile, CLOUDINARY_VIDEO_URL, true);
            const videoUrl = videoResponse.secure_url;
            const duration = videoResponse.duration || videoDuration;
            
            toast({ title: "Finalizing..." });

            await addDoc(collection(db, 'videos'), {
                title: metadata.title,
                description: metadata.description,
                visibility: metadata.visibility,
                audience: metadata.audience,
                videoUrl,
                thumbnailUrl,
                duration: duration,
                type: duration < 60 ? 'short' : 'long',
                channelId: user.channel.id,
                createdAt: serverTimestamp(),
                views: 0,
                likes: 0,
                category: metadata.category || "General",
            });
            
            toast({ title: "Upload complete!", description: `'${metadata.title}' has been published.` });
            router.push('/studio');

        } catch (error: any) {
            alert(error.message); // As requested
            console.error("Upload process failed:", error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: "There was a problem uploading your video. " + error.message,
            });
        } finally {
            setIsUploading(false);
            setFileName("");
            setThumbnailPreview(null);
            setUploadTask(null);
        }
    };
    
    const value = { isUploading, uploadProgress, fileName, thumbnailPreview, startUpload, cancelUpload };

    return (
        <UploadContext.Provider value={value}>
            <div key="global-upload-wrapper" style={{ display: 'contents' }}>
                {children}
            </div>
        </UploadContext.Provider>
    );
};

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error("useUpload must be used within an UploadProvider");
    }
    return context;
};
