
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Video } from "@/lib/types";
import { formatViews } from "@/lib/utils";
import React from "react";
import { Skeleton } from "./ui/skeleton";
import { MoreVertical } from "lucide-react";

type VideoCardProps = {
  video: Video;
};

export function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();
  
  if (!video || !video.channel) {
      return (
           <div className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
      )
  }

  const timeAgo = video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : '...';
  const duration = video.duration ? new Date(video.duration * 1000).toISOString().substr(14, 5) : '0:00';

  const handleCardClick = () => {
    router.push(`/watch?v=${video.id}`);
  };

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/@${video.channel.handle}`);
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would open a menu
    alert("Menu clicked for " + video.title);
  };

  return (
    <div onClick={handleCardClick} className="block w-full cursor-pointer group">
      <div className="flex flex-col space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="video thumbnail"
          />
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {duration}
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div onClick={handleChannelClick} className="flex-shrink-0">
            <Avatar>
              <AvatarImage src={video.channel.photoURL} alt={video.channel.handle} />
              <AvatarFallback>
                {video.channel.handle.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium leading-tight text-foreground clamp-2" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {video.title}
            </p>
            <div className="mt-1 text-sm text-muted-foreground">
              <p className="truncate hover:text-foreground" onClick={handleChannelClick}>{video.channel.fullName}</p>
              <p>
                {formatViews(video.views)} views &middot; {timeAgo}
              </p>
            </div>
          </div>
           <button onClick={handleMenuClick} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5 text-muted-foreground"/>
           </button>
        </div>
      </div>
    </div>
  );
}
