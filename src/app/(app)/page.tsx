import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  // In a real app, you would fetch this data from your backend
  const videos = mockVideos;

  return (
    <div className="flex flex-col">
      <header className="p-4">
        <h1 className="text-2xl font-bold font-headline">Home</h1>
      </header>
      <div className="flex flex-col space-y-6 p-4 pt-0">
        {videos.map((video, index) => (
          <>
            <VideoCard key={video.id} video={video} />
            {index < videos.length - 1 && <Separator className="my-2" />}
          </>
        ))}
      </div>
    </div>
  );
}
