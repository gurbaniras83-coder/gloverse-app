'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export const MonetagInterstitialAd = () => {
    // Monetag interstitial ads are often script-based and might trigger on page load or interaction.
    // This component ensures the script is loaded only when requested (i.e., when AdMob fails).
    // The script itself handles when to show the ad.

    useEffect(() => {
        console.log("Monetag Interstitial Ad fallback triggered.");
    }, []);

    return (
        <Script
            id="monetag-interstitial-script"
            strategy="afterInteractive"
            src="//monetagal.com/db/8f/3e/ff/8f3eff3e685f7a14f5263a2b7f2945e4.js" // Placeholder Monetag script
        />
    );
};
