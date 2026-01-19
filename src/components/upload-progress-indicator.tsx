
"use client";

import { useUpload } from "@/context/upload-provider";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";
import NextImage from "next/image";

export default function UploadProgressIndicator() {
  const { isUploading, uploadProgress, fileName, thumbnailPreview, cancelUpload } = useUpload();

  if (!isUploading) {
    return null;
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 z-50 p-4 max-w-[500px] mx-auto pointer-events-auto">
        <div className="bg-secondary rounded-lg shadow-2xl p-4 border border-border">
            <div className="flex items-start gap-4">
                {thumbnailPreview ? (
                    <div className="relative w-16 h-10 rounded-md overflow-hidden flex-shrink-0">
                       <NextImage src={thumbnailPreview} alt="uploading thumbnail" layout="fill" className="object-cover" />
                    </div>
                ) : (
                    <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold truncate">Uploading your video...</p>
                   <p className="text-xs text-muted-foreground truncate">{fileName || '...'}</p>
                   <Progress value={uploadProgress.percentage} className="w-full mt-2 h-2" />
                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                       <span>{Math.round(uploadProgress.percentage)}%</span>
                       <span>{formatBytes(uploadProgress.transferred)} / {formatBytes(uploadProgress.total)}</span>
                   </div>
                </div>
                 <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-2 -mr-2" onClick={cancelUpload}>
                    <X className="w-4 h-4"/>
                </Button>
            </div>
        </div>
    </div>
  );
}
