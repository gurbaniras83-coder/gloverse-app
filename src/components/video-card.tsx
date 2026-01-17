import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, subDays } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Video } from "@/lib/types";
import { formatViews } from "@/lib/utils";

type VideoCardProps = {
  video: Video;
};

export function VideoCard({ video }: VideoCardProps) {
  const timeAgo = formatDistanceToNow(video.createdAt, { addSuffix: true });

  return (
    <Link href={`/watch?v=${video.id}`} className="block w-full">
      <div className="flex flex-col space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            data-ai-hint="video thumbnail"
          />
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {new Date(video.duration * 1000).toISOString().substr(14, 5)}
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Link href={`/@${video.channel.handle}`} className="flex-shrink-0">
            <Avatar>
              <AvatarImage src={video.channel.photoURL} alt={video.channel.handle} />
              <AvatarFallback>
                {video.channel.handle.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-medium leading-tight text-foreground">
              {video.title}
            </h3>
            <div className="mt-1 text-sm text-muted-foreground">
              <p className="truncate">{video.channel.fullName}</p>
              <p>
                {formatViews(video.views)} views &middot; {timeAgo}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
