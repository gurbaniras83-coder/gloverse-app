
'use client';

import { useEffect } from 'react';
import { adConfig } from '@/lib/adConfig';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
    interface Window {
        adsbygoogle?: { [key: string]: unknown }[];
    }
}

export function BannerAd({ className }: { className?: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const adSlotId = adConfig.homeBannerAdUnit.split('/')[1];

    // Create a key that changes with the full URL, including search parameters.
    // This is crucial for SPA navigation where the pathname might not change, but the content does.
    const urlKey = `${pathname}?${searchParams.toString()}`;

    useEffect(() => {
        // This effect re-runs on route changes (because of the `urlKey` dependency),
        // signaling AdSense to look for new or replaced ad slots on the page.
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            // This error is common in development environments and can often be ignored.
            // It indicates that the ad container was re-rendered before an ad could be fetched.
            console.error("AdSense execution error: ", err);
        }
    }, [urlKey]); // Depend on the full URL key

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
                    // By using a key that includes search params, we force React to re-create this DOM element
                    // even when only the query string changes (e.g., navigating from one video to another).
                    key={urlKey}
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '320px', height: '100px' }}
                    data-ad-client={adConfig.adsensePublisherId}
                    data-ad-slot={adSlotId}
                />
             </div>
        </div>
    );
}
