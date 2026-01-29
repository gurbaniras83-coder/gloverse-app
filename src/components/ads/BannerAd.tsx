'use client';

import { useEffect, useRef } from 'react';
import { adConfig } from '@/lib/adConfig';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        adsbygoogle?: { [key: string]: unknown }[];
    }
}

export function BannerAd({ className }: { className?: string }) {
    const insRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        const adElement = insRef.current;

        // If the ad element is not there, or if it has already been initialized, do nothing.
        // AdSense adds the "data-adsbygoogle-status" attribute once it processes the ad slot.
        if (!adElement || adElement.hasAttribute('data-adsbygoogle-status')) {
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("AdSense execution error: ", err);
        }
    }, []);

    const adSlotId = adConfig.homeBannerAdUnit.split('/')[1];
    
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
                    ref={insRef}
                    key={`ads-banner-${adSlotId}`}
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '320px', height: '100px' }}
                    data-ad-client={adConfig.adsensePublisherId}
                    data-ad-slot={adSlotId}
                />
             </div>
        </div>
    );
}
