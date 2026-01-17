import { VideoCard } from "@/components/video-card";
import { mockVideos, mockShorts } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { ShortsShelf } from "@/components/shorts-shelf";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  // In a real app, you would fetch this data from your backend
  const longVideos = mockVideos.filter(v => v.type === 'long');
  const shorts = mockShorts;

  return (
    <div className="flex flex-col">
      <header className="p-4">
        <Logo />
      </header>
      <div className="flex flex-col">
        {shorts.length > 0 && <ShortsShelf shorts={shorts} />}

        <div className="flex flex-col space-y-6 p-4">
          {longVideos.map((video, index) => (
            <React.Fragment key={video.id}>
              <VideoCard video={video} />
              {index < longVideos.length - 1 && <Separator className="my-2" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
