/**
 * Ad Configuration for GloVerse
 * 
 * IMPORTANT: These values are sourced from environment variables.
 * They are configured for Google AdMob and may require a specific 
 * environment (like a mobile app webview) to function correctly.
 * The Google Ad Manager placeholders are for web video ads.
 */
export const adConfig = {
  /**
   * Your Google AdSense Publisher ID, required for the AdSense script to work.
   * This is derived from your AdMob App ID.
   * Format: ca-pub-XXXXXXXXXXXXXXXX
   */
  adsensePublisherId: "ca-pub-1748016542298496",

  /**
   * Your Google AdMob App ID.
   * Sourced from NEXT_PUBLIC_ADMOB_APP_ID.
   * Format: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
   */
  admobAppId: process.env.NEXT_PUBLIC_ADMOB_APP_ID || "ca-app-pub-1748016542298496~6856935113",

  /**
   * AdMob Ad Unit ID for banner ads. Used on the Home page.
   * Sourced from NEXT_PUBLIC_ADMOB_BANNER_ID.
   */
  homeBannerAdUnit: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-1748016542298496/3796891030",

  /**
   * AdMob Ad Unit ID for interstitial ads.
   * Sourced from NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID.
   */
  interstitialAdUnit: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || "ca-app-pub-1748016542298496/1738477982",
  
  /**
   * AdMob Ad Unit ID for rewarded video ads.
   * Sourced from NEXT_PUBLIC_ADMOB_REWARDED_ID.
   */
  rewardedAdUnit: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || "ca-app-pub-1748016542298496/4173069638",
  
  /**
   * AdMob Ad Unit ID for native ads. Used in Shorts feed and Search.
   * Sourced from NEXT_PUBLIC_ADMOB_NATIVE_ID.
   */
  nativeAdUnit: process.env.NEXT_PUBLIC_ADMOB_NATIVE_ID || "ca-app-pub-1748016542298496/4283976199",


  // --- The following are for Google Ad Manager (web video ads) ---
  
  /**
   * Google Ad Manager (GAM) Video Ad Unit for **Pre-roll** ads.
   * **IMPORTANT**: This must be a GAM ad unit path, not an AdMob ID.
   * Used for skippable ads that play before video content.
   * Sourced from NEXT_PUBLIC_GAM_PREROLL_AD_UNIT.
   * Example: /123456789/web/preroll
   */
  preRollAdUnit: process.env.NEXT_PUBLIC_GAM_PREROLL_AD_UNIT || "/6499/example/preroll",
  
  /**
   * Google Ad Manager (GAM) Video Ad Unit for **Mid-roll** ads.
   * **IMPORTANT**: This must be a GAM ad unit path, not an AdMob ID.
   * Used for ads that play during long-form video content.
   * Sourced from NEXT_PUBLIC_GAM_MIDROLL_AD_UNIT.
   * Example: /123456789/web/midroll
   */
  midRollAdUnit: process.env.NEXT_PUBLIC_GAM_MIDROLL_AD_UNIT || "/6499/example/midroll",

  // DEPRECATED placeholder fields, mapped to new AdMob units for compatibility.
  shortsFeedAdUnit: process.env.NEXT_PUBLIC_ADMOB_NATIVE_ID || "ca-app-pub-1748016542298496/4283976199",
  searchTopAdUnit: process.env.NEXT_PUBLIC_ADMOB_NATIVE_ID || "ca-app-pub-1748016542298496/4283976199",
};
