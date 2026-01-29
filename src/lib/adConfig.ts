/**
 * Ad Configuration for GloVerse
 * 
 * IMPORTANT: Replace the placeholder values with your actual
 * Google Ad Manager and AdSense IDs.
 */
export const adConfig = {
  /**
   * Your Google AdSense Publisher ID.
   * This is required for the AdSense script to work.
   * Format: ca-pub-XXXXXXXXXXXXXXXX
   */
  adsensePublisherId: "ca-pub-0000000000000000",

  /**
   * Video Ad Unit ID for Pre-roll ads (played before a video).
   * From Google Ad Manager.
   * Example: /123456789/preroll
   */
  preRollAdUnit: "/6499/example/preroll",
  
  /**
   * Video Ad Unit ID for Mid-roll ads (played during a video).
   * From Google Ad Manager.
   * Example: /123456789/midroll
   */
  midRollAdUnit: "/6499/example/midroll",

  /**
   * AdSense Ad Unit ID for the ad shown in the Shorts feed.
   * From your AdSense account.
   */
  shortsFeedAdUnit: "0000000000",

  /**
   * AdSense Ad Unit ID for the banner ad on the Home page.
   * From your AdSense account.
   */
  homeBannerAdUnit: "0000000000",
  
  /**
   * AdSense Ad Unit ID for the ad at the top of search results.
   * From your AdSense account.
   */
  searchTopAdUnit: "0000000000",
};
