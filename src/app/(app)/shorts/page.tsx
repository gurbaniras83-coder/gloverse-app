import { ShortsPlayer } from "@/components/shorts-player";

export const dynamic = 'force-dynamic';

export default function ShortsPage() {
  return (
    <div className="h-full w-full bg-black">
        <ShortsPlayer />
    </div>
  );
}
