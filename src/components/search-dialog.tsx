
"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { debounce } from "lodash";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import type { Video as VideoType, Channel } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

type SearchResult =
    | { type: 'video', data: VideoType }
    | { type: 'channel', data: Channel }
    | { type: 'ad', data: { id: string; title: string; description: string; link: string; imageUrl: string; }};

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const performSearch = async (sQuery: string) => {
    if (sQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const lowerCaseQuery = sQuery.toLowerCase();
      const capitalizedQuery = sQuery.charAt(0).toUpperCase() + sQuery.slice(1).toLowerCase();
      
      const videoTitleQuery = query(
        collection(db, "videos"),
        where("visibility", "==", "public"),
        where("title", ">=", sQuery),
        where("title", "<=", sQuery + '\uf8ff'),
        limit(5)
      );

       const videoCategoryQuery = query(
        collection(db, "videos"),
        where("visibility", "==", "public"),
        where("category", "==", capitalizedQuery),
        limit(5)
      );

      const channelHandleQuery = query(
        collection(db, "channels"),
        where("handle", ">=", lowerCaseQuery),
        where("handle", "<=", lowerCaseQuery + '\uf8ff'),
        limit(3)
      );
      
      const [videoTitleSnap, videoCategorySnap, channelSnap] = await Promise.all([
          getDocs(videoTitleQuery),
          getDocs(videoCategoryQuery),
          getDocs(channelHandleQuery)
      ]);

      const videoResults = new Map<string, VideoType>();
      videoTitleSnap.docs.forEach(doc => {
          if (!videoResults.has(doc.id)) {
              videoResults.set(doc.id, { id: doc.id, ...doc.data() } as VideoType);
          }
      });
      videoCategorySnap.docs.forEach(doc => {
          if (!videoResults.has(doc.id)) {
              videoResults.set(doc.id, { id: doc.id, ...doc.data() } as VideoType);
          }
      });

      const finalVideoResults = Array.from(videoResults.values()).map(data => ({ type: 'video' as const, data }));
      const channelResults = channelSnap.docs.map(doc => ({ type: 'channel' as const, data: { id: doc.id, ...doc.data() } as Channel }));
      
      const combinedResults: SearchResult[] = [...channelResults, ...finalVideoResults];

      if (sQuery.trim().length > 0 && combinedResults.length > 0) {
        const adResult: SearchResult = {
            type: 'ad',
            data: {
                id: 'sponsored-search-1',
                title: 'Build Apps Faster with AI',
                description: 'Join the waitlist for the new Firebase Studio.',
                link: '#', 
                imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop'
            }
        };
        combinedResults.unshift(adResult);
      }
      
      setResults(combinedResults);

    } catch (e) {
      console.error("Search failed:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 400), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleResultClick = (result: SearchResult) => {
      setIsOpen(false);
      setSearchQuery("");
      setResults([]);
      if (result.type === 'video') {
          router.push(`/watch?v=${result.data.id}`);
      } else if (result.type === 'channel') {
          router.push(`/@${result.data.handle}`);
      } else if (result.type === 'ad') {
          toast({ title: "Sponsored link clicked!", description: "In a real app, this would navigate to an external page." });
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2" aria-label="Search">
          <Search className="h-6 w-6 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="top-0 translate-y-0 h-full max-h-[100dvh] max-w-[500px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="sr-only">Search Gloverse</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search Gloverse" 
              className="border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
            {loading && <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>}
            {!loading && results.length > 0 && (
                <div className="space-y-1 p-2">
                    {results.map((result) => {
                       if (result.type === 'ad') {
                          return (
                              <div key={`${result.type}-${result.data.id}`} onClick={() => handleResultClick(result)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary cursor-pointer border border-dashed border-primary/50">
                                  <div className="w-16 h-12 bg-secondary rounded-md flex-shrink-0 relative overflow-hidden">
                                      <Image src={result.data.imageUrl} alt={result.data.title} fill className="object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold line-clamp-1">{result.data.title}</p>
                                        <span className="text-xs font-semibold text-primary/90">Sponsored</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground line-clamp-1">{result.data.description}</p>
                                  </div>
                              </div>
                          );
                      }
                      return (
                        <div key={`${result.type}-${result.data.id}`} onClick={() => handleResultClick(result)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                            {result.type === 'channel' ? (
                                <>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={result.data.photoURL} alt={result.data.handle} />
                                        <AvatarFallback>{result.data.handle[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{result.data.fullName}</p>
                                        <p className="text-sm text-muted-foreground">@{result.data.handle}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 aspect-video bg-secondary rounded-md flex-shrink-0 relative overflow-hidden">
                                        {result.data.thumbnailUrl && <Image src={result.data.thumbnailUrl} alt={result.data.title} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold line-clamp-2">{result.data.title}</p>
                                    </div>
                                </>
                            )}
                        </div>
                      )
                    })}
                </div>
            )}
            {!loading && searchQuery.length > 1 && results.length === 0 && (
                <p className="text-center p-8 text-muted-foreground">No results for "{searchQuery}"</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
