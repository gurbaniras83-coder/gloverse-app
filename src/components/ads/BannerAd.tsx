
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { adConfig } from '@/lib/adConfig';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
    interface Window {
        adsbygoogle?: { [key: string]: unknown }[];
    }
}

// Using a non-memoized component internally to handle hooks, and memoizing the export.
const BannerAdComponent = ({ className }: { className?: string }) => {
    const adRef = useRef<HTMLModElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // We need to track the full URL to know when to reset our ad loading logic on navigation.
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlKey = `${pathname}?${searchParams.toString()}`;

    // When the URL changes (i.e., user navigates), reset the `isLoaded` state.
    // This allows the main useEffect to attempt to load a new ad for the new page.
    useEffect(() => {
        setIsLoaded(false);
    }, [urlKey]);

    useEffect(() => {
        // Primary guard: if we've already pushed an ad for this component instance, do nothing.
        if (isLoaded) {
            return;
        }

        const insElement = adRef.current;
        
        // Extra safety checks before attempting to push.
        if (
            insElement &&
            window.adsbygoogle &&
            // Check if AdSense has already processed this specific slot.
            insElement.getAttribute('data-adsbygoogle-status') !== 'loaded'
        ) {
            try {
                window.adsbygoogle.push({});
                // If the push is attempted, we mark this instance as loaded to prevent retries.
                setIsLoaded(true);
            } catch (err) {
                // This block is intentionally left empty to suppress any errors in the console.
            }
        }
    // This effect re-evaluates whenever `isLoaded` is reset (which happens on urlKey change).
    }, [isLoaded, urlKey]);

    const adSlotId = adConfig.homeBannerAdUnit.split('/')[1];

    if (!adSlotId) {
        return (
             <div className={cn("flex flex-col items-center justify-center w-full min-h-[124px] bg-secondary rounded-lg p-2", className)}>
                <span className="text-xs font-semibold self-start mb-1" style={{ color: '#FFD700' }}>Sponsored</span>
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Ad unit not configured.
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col items-center justify-center w-full", className)}>
             <span className="text-xs font-semibold self-start mb-1" style={{ color: '#FFD700' }}>Sponsored</span>
             <div className="w-full flex items-center justify-center bg-secondary rounded-lg min-h-[100px]">
                <ins
                    ref={adRef}
                    // This key is still important. It tells React to create a fresh <ins>
                    // element on navigation, which is crucial for our checks to work reliably.
                    key={urlKey} 
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '320px', height: '100px' }}
                    data-ad-client={adConfig.adsensePublisherId}
                    data-ad-slot={adSlotId}
                />
             </div>
        </div>
    );
};

// Wrap the component with React.memo to prevent unnecessary re-renders.
export const BannerAd = React.memo(BannerAdComponent);
