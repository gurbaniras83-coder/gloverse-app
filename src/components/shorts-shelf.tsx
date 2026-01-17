"use client"

import { Video } from "@/lib/types";
import { Flame } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { formatViews } from "@/lib/utils";
import { Separator } from "./ui/separator";

export function ShortsShelf({ shorts }: { shorts: Video[] }) {
    const router = useRouter();

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-4"><Flame className="text-primary"/> Shorts</h2>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-3 px-4">
                    {shorts.map(short => (
                        <div key={short.id} className="w-40 cursor-pointer" onClick={() => router.push('/shorts')}>
                            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl">
                                <Image src={short.thumbnailUrl} alt={short.title} fill className="object-cover" data-ai-hint="short video thumbnail"/>
                            </div>
                            <div className="mt-2">
                                <h3 className="text-sm font-semibold truncate">{short.title}</h3>
                                <p className="text-xs text-muted-foreground">{formatViews(short.views)} views</p>
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Separator />
        </div>
    );
}
