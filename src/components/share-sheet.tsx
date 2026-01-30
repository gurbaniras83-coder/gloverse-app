'use client';

import { Video } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Instagram, Send as TelegramIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

// SVG for WhatsApp icon
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

interface ShareSheetProps {
  video: Video;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareSheet({ video, open, onOpenChange }: ShareSheetProps) {
  const { toast } = useToast();
  const shareUrl = `https://gloverse-app.vercel.app/watch?v=${video.id}`;

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "The video link has been copied to your clipboard.",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full max-w-[500px] mx-auto rounded-t-xl border-none bg-secondary text-foreground p-4">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-xl font-bold">Share Video</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
            <div className="w-24 aspect-video bg-background rounded-md flex-shrink-0 relative overflow-hidden">
                {video.thumbnailUrl && <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-2">{video.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{video.channel?.fullName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="flex-1 p-2 bg-background rounded-md text-sm text-muted-foreground truncate">{shareUrl}</p>
            <Button size="icon" onClick={copyLink}>
              <Copy className="w-5 h-5"/>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <Link href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted" onClick={() => onOpenChange(false)}>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <WhatsAppIcon className="w-6 h-6" />
                </div>
                <span className="text-xs">WhatsApp</span>
            </Link>
             <Link href={`https://www.instagram.com`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted" onClick={() => onOpenChange(false)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 text-white flex items-center justify-center">
                    <Instagram />
                </div>
                <span className="text-xs">Instagram</span>
            </Link>
            <Link href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(video.title)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted" onClick={() => onOpenChange(false)}>
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <TelegramIcon />
                </div>
                <span className="text-xs">Telegram</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
