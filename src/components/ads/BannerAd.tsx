
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

const AdsterraFallbackBanner = () => (
    <div className="w-[320px] h-[100px] bg-secondary rounded-lg flex items-center justify-center">
        <a href="https://www.adsterra.com/" target="_blank" rel="noopener noreferrer">
            {/* Placeholder for Adsterra banner image */}
            <img src="https://via.placeholder.com/320x100.png?text=Adsterra+Banner" alt="Ad" />
        </a>
    </div>
);


// Using a non-memoized component internally to handle hooks, and memoizing the export.
const BannerAdComponent = ({ className }: { className?: string }) => {
    const adRef = useRef<HTMLModElement>(null);
    const [adState, setAdState] = useState<'loading' | 'success' | 'failed'>('loading');
    
    // We need to track the full URL to know when to reset our ad loading logic on navigation.
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlKey = `${pathname}?${searchParams.toString()}`;

    // Reset state on navigation
    useEffect(() => {
        setAdState('loading');
    }, [urlKey]);

    useEffect(() => {
        if (adState !== 'loading') {
            return;
        }

        const adSlot = adRef.current;
        if (!adSlot) {
            return;
        }
        
        // Try to push AdMob ad
        try {
            if (window.adsbygoogle && adSlot.getAttribute('data-adsbygoogle-status') !== 'loaded') {
                window.adsbygoogle.push({});
            }
        } catch (err) {
             // This block is intentionally left empty to suppress any errors in the console.
        }

        // Set a timeout to check if the ad loaded
        const fallbackTimer = setTimeout(() => {
            if (adSlot.getAttribute('data-adsbygoogle-status') !== 'loaded' && adSlot.innerHTML.trim() === '') {
                setAdState('failed');
            } else {
                setAdState('success');
            }
        }, 3000); // 3 seconds to wait for AdMob

        return () => clearTimeout(fallbackTimer);
    }, [adState, urlKey]);

    const adSlotId = adConfig.homeBannerAdUnit.split('/')[1];

    if (!adSlotId) {
        // Render Adsterra directly if AdMob is not configured
        return (
             <div className={cn("flex flex-col items-center justify-center w-full", className)}>
                <span className="text-xs font-semibold self-start mb-1" style={{ color: '#FFD700' }}>Sponsored</span>
                <AdsterraFallbackBanner />
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col items-center justify-center w-full", className)}>
             <span className="text-xs font-semibold self-start mb-1" style={{ color: '#FFD700' }}>Sponsored</span>
             
             {adState === 'failed' ? (
                <AdsterraFallbackBanner />
             ) : (
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
             )}
        </div>
    );
};

// Wrap the component with React.memo to prevent unnecessary re-renders.
export const BannerAd = React.memo(BannerAdComponent);
