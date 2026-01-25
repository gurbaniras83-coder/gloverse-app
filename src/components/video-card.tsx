
"use client";

import Image from "next/image";
import Link from "next/link";
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
    );
  }

  const timeAgo = video.createdAt
    ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
    : "...";
  const duration = video.duration
    ? new Date(video.duration * 1000).toISOString().substr(14, 5)
    : "0:00";

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // In a real app, this would open a menu
    alert("Menu clicked for " + video.title);
  };

  return (
    <div className="flex flex-col space-y-3 group">
      <Link href={`/watch?v=${video.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="video thumbnail"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary" />
          )}
          {video.duration > 0 && (
            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
              {duration}
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-start space-x-3">
        <Link href={`/@${video.channel.handle}`} className="flex-shrink-0">
            <Avatar>
              <AvatarImage
                src={video.channel.photoURL}
                alt={video.channel.handle}
              />
              <AvatarFallback>
                {video.channel.handle.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/watch?v=${video.id}`} className="block">
              <p
                className="text-base font-medium leading-tight text-foreground clamp-2"
                style={{
                  WebkitLineClamp: 2,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {video.title}
              </p>
          </Link>
          <div className="mt-1 text-sm text-muted-foreground">
            <Link href={`/@${video.channel.handle}`} className="block">
              <p className="truncate hover:text-primary">
                {video.channel.fullName}
              </p>
            </Link>
            <p suppressHydrationWarning>
              {formatViews(video.views)} views &middot; {timeAgo}
            </p>
          </div>
        </div>
        <button
          onClick={handleMenuClick}
          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

    