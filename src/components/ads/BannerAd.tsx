
'use client';

import React, { useEffect, useRef } from 'react';
import { adConfig } from '@/lib/adConfig';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
    interface Window {
        adsbygoogle?: { [key: string]: unknown }[];
    }
}

// Using a non-memoized component internally to handle hooks
const BannerAdComponent = ({ className }: { className?: string }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const adRef = useRef<HTMLModElement>(null);

    // A unique key based on the full URL is crucial. It forces React to
    // unmount the old <ins> tag and mount a new one on navigation.
    const urlKey = `${pathname}?${searchParams.toString()}`;
    const adSlotId = adConfig.homeBannerAdUnit.split('/')[1];

    useEffect(() => {
        const insElement = adRef.current;

        // Check if the ad slot has already been processed by AdSense.
        // AdSense adds `data-adsbygoogle-status="loaded"` to the `ins` tag once it's filled.
        // We only want to push a new ad request if the slot is fresh.
        if (insElement && insElement.getAttribute('data-adsbygoogle-status') !== 'loaded') {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
                // This error is common in dev environments where the AdSense script
                // might not load, or if an ad is blocked.
                console.error("AdSense push error: ", err);
            }
        }
    }, [urlKey]); // The effect re-runs whenever the URL changes.

    if (!adSlotId) {
        return (
             <div className={cn("flex flex-col items-center justify-center w-full min-h-[124px] bg-secondary rounded-lg p-2", className)}>
                <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>Sponsored</span>
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
                    key={urlKey} // This key is essential to force a re-mount on navigation
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '320px', height: '100px' }}
                    data-ad-client={adConfig.adsensePublisherId}
                    data-ad-slot={adSlotId}
                />
             </div>
        </div>
    );
};

// Wrap the component with React.memo as requested to prevent unnecessary re-renders
// from parent components if its own props (like className) haven't changed.
export const BannerAd = React.memo(BannerAdComponent);
