
"use client";

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind } from 'lucide-react';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { adConfig } from '@/lib/adConfig';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

// Define google.ima types locally to avoid installing @types/google.ima
declare global {
  interface Window {
    google: any;
  }
}

interface CustomVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  onAdLoadFailed?: () => void;
}

export const CustomVideoPlayer = forwardRef<{ video: HTMLVideoElement | null }, CustomVideoPlayerProps>(
  ({ src, autoPlay = false, onAdLoadFailed }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null); // For IMA SDK
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // IMA SDK Refs
  const imaRefs = useRef<{
    adDisplayContainer: any | null,
    adsLoader: any | null,
    adsManager: any | null,
  }>({ adDisplayContainer: null, adsLoader: null, adsManager: null });
  const midrollCuePoints = useRef<number[]>([]);
  const playedMidrolls = useRef<Set<number>>(new Set());

  // Player State
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(autoPlay); // Mute autoplay by default
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipFeedback, setShowSkipFeedback] = useState<'forward' | 'backward' | null>(null);

  // Ad State
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [isAdSkippable, setIsAdSkippable] = useState(false);
  const [adCountdown, setAdCountdown] = useState('');
  const [prerollPlayed, setPrerollPlayed] = useState(false);

  const lastClickTimeRef = useRef(0);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    video: videoRef.current
  }));

  const playContent = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.play().catch(e => console.error("Content play failed", e));
    }
  }, []);
  
  const buildAdTagUrl = (adUnit: string) => {
    // This is a sample ad tag URL structure. You may need to adjust it based on your Ad Manager setup.
    const baseUrl = 'https://pubads.g.doubleclick.net/gampad/ads';
    const params = new URLSearchParams({
        sz: '640x480',
        iu: adUnit,
        impl: 's',
        gdfp_req: '1',
        env: 'vp',
        output: 'vast',
        unviewed_position_start: '1',
        cust_params: encodeURIComponent('deployment=gloverse&sample_ct=linear'),
        correlator: Date.now().toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  }

  const onAdError = useCallback((adErrorEvent: any) => {
      const error = adErrorEvent.getError();
      console.error('Ad Error: ' + error.toString());
      toast({
          variant: "destructive",
          title: "Ad Playback Error",
          description: `Could not load ad. Error: ${error.getMessage()}`,
      });
      if (imaRefs.current.adsManager) {
        imaRefs.current.adsManager.destroy();
      }
      setIsAdPlaying(false);
      playContent();
      if (onAdLoadFailed) {
        onAdLoadFailed();
      }
  }, [playContent, toast, onAdLoadFailed]);

  const onContentPauseRequested = useCallback(() => {
      setIsAdPlaying(true);
      videoRef.current?.pause();
  }, []);

  const onContentResumeRequested = useCallback(() => {
      setIsAdPlaying(false);
      if (!prerollPlayed) setPrerollPlayed(true);
      playContent();
  }, [playContent, prerollPlayed]);

  const onAdSkippableChanged = useCallback(() => {
      const ad = imaRefs.current.adsManager?.getCurrentAd();
      if (ad?.isSkippable()) {
          setIsAdSkippable(true);
      }
  }, []);
  
  const onAdProgress = useCallback((adProgressData: any) => {
      const adData = adProgressData.getAdData();
      const remaining = Math.ceil(adData.remainingTime);
      
      // The skippable time is 5s for the sample tag.
      const skippableTime = 5;
      if (adData.skippable) {
          const skipTime = Math.ceil(skippableTime - adData.currentTime);
          if (skipTime > 0) {
              setAdCountdown(`Skip in ${skipTime}`);
          } else {
              setAdCountdown(`Ad: ${remaining}s`);
          }
      } else if (remaining > 0) {
          setAdCountdown(`Ad: ${remaining}s`);
      }
  }, []);

  const onAdComplete = useCallback(() => {
      setIsAdSkippable(false);
      setAdCountdown('');
  }, []);

  const onAdsManagerLoaded = useCallback((adsManagerLoadedEvent: any) => {
      const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
      
      imaRefs.current.adsManager = adsManagerLoadedEvent.getAdsManager(videoRef.current, adsRenderingSettings);
      
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED, onAdSkippableChanged);
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdEvent.Type.AD_PROGRESS, onAdProgress);
      imaRefs.current.adsManager.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, onAdComplete);

      try {
          const viewMode = isFullscreen ? window.google.ima.ViewMode.FULLSCREEN : window.google.ima.ViewMode.NORMAL;
          imaRefs.current.adsManager.init(videoRef.current?.clientWidth, videoRef.current?.clientHeight, viewMode);
          imaRefs.current.adsManager.start();
      } catch (adError) {
           console.error("AdsManager could not be started", adError);
           playContent();
      }
  }, [isFullscreen, onAdComplete, onAdError, onAdProgress, onAdSkippableChanged, onContentPauseRequested, onContentResumeRequested, playContent]);

  const setupIMA = useCallback(() => {
      if (!videoRef.current || !adContainerRef.current || !window.google?.ima) return;
      
      if (imaRefs.current.adDisplayContainer) return; // Already setup

      imaRefs.current.adDisplayContainer = new window.google.ima.AdDisplayContainer(adContainerRef.current, videoRef.current);
      imaRefs.current.adsLoader = new window.google.ima.AdsLoader(imaRefs.current.adDisplayContainer);
      
      imaRefs.current.adsLoader.addEventListener(
          window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          onAdsManagerLoaded,
          false
      );
      imaRefs.current.adsLoader.addEventListener(
          window.google.ima.AdErrorEvent.Type.AD_ERROR,
          onAdError,
          false
      );
      
      const contentEnded = () => { imaRefs.current.adsLoader?.contentComplete(); };
      videoRef.current.addEventListener('ended', contentEnded);

      return () => {
          videoRef.current?.removeEventListener('ended', contentEnded);
      }
  }, [onAdsManagerLoaded, onAdError]);
  
  useEffect(() => {
    // Only run setup once video element is available
    if (videoRef.current) {
        setupIMA();
    }
  }, [setupIMA]);
  
  const requestAds = useCallback((adTagUrl: string) => {
      if (!imaRefs.current.adsLoader || !videoRef.current) {
          console.warn("Ads loader/video not ready.");
          playContent();
          return;
      }
      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = adTagUrl;
      adsRequest.linearAdSlotWidth = videoRef.current.clientWidth;
      adsRequest.linearAdSlotHeight = videoRef.current.clientHeight;
      adsRequest.nonLinearAdSlotWidth = videoRef.current.clientWidth;
      adsRequest.nonLinearAdSlotHeight = videoRef.current.clientHeight;
      imaRefs.current.adsLoader.requestAds(adsRequest);
  }, [playContent]);

  // --- Core Playback Logic ---
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || isAdPlaying) return;

    if (!prerollPlayed && video.paused) {
        imaRefs.current.adDisplayContainer?.initialize();
        requestAds(buildAdTagUrl(adConfig.preRollAdUnit));
        setPrerollPlayed(true);
        return;
    }

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isAdPlaying, prerollPlayed, requestAds]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && !isAdPlaying) {
      setProgress(video.currentTime);
      
      const currentTime = Math.floor(video.currentTime);
      for (const cuePoint of midrollCuePoints.current) {
          if (currentTime >= cuePoint && !playedMidrolls.current.has(cuePoint)) {
              console.log(`Requesting mid-roll at ${cuePoint}s`);
              requestAds(buildAdTagUrl(adConfig.midRollAdUnit));
              playedMidrolls.current.add(cuePoint);
              break; 
          }
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const videoDuration = video.duration;
      setDuration(videoDuration);

      if (videoDuration > 3600) { // > 60 minutes
          const fiveMinutes = 300;
          const cuePoints: number[] = [];
          for (let i = fiveMinutes; i < videoDuration; i += fiveMinutes) {
              cuePoints.push(i);
          }
          midrollCuePoints.current = cuePoints;
      }
    }
  };

  useEffect(() => {
    if (autoPlay && videoRef.current && !prerollPlayed) {
        const video = videoRef.current;
        const handleCanPlay = () => {
             imaRefs.current.adDisplayContainer?.initialize();
             requestAds(buildAdTagUrl(adConfig.preRollAdUnit));
             setPrerollPlayed(true);
             video.removeEventListener('canplay', handleCanPlay);
        }
        video.addEventListener('canplay', handleCanPlay);
        return () => video.removeEventListener('canplay', handleCanPlay);
    }
  }, [autoPlay, prerollPlayed, requestAds]);

  const skipAd = () => {
      imaRefs.current.adsManager?.skip();
  };

  // --- Volume & Mute ---
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && video.volume === 0) {
      video.volume = 1;
      setVolume(1);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  // --- Seeking ---
  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setProgress(value[0]);
  };

  // --- Fullscreen ---
  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;
    
    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else {
      document.exitFullscreen().catch(err => console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`));
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
       if (imaRefs.current.adsManager) {
            const video = videoRef.current;
            if (isFs) {
                imaRefs.current.adsManager.resize(window.screen.width, window.screen.height, window.google.ima.ViewMode.FULLSCREEN);
            } else if (video) {
                imaRefs.current.adsManager.resize(video.clientWidth, video.clientHeight, window.google.ima.ViewMode.NORMAL);
            }
       }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- Double Tap to Skip ---
  const handleSkip = useCallback((direction: 'forward' | 'backward') => {
    if (isAdPlaying) return;
    const video = videoRef.current;
    if (!video) return;
    const skipAmount = 10;
    video.currentTime += (direction === 'forward' ? skipAmount : -skipAmount);
    setShowSkipFeedback(direction);
    setTimeout(() => setShowSkipFeedback(null), 500);
  }, [isAdPlaying]);

  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = new Date().getTime();
    if (now - lastClickTimeRef.current < 300) { // Double click
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX > rect.width / 2) {
        handleSkip('forward');
      } else {
        handleSkip('backward');
      }
    } else { // Single click
      togglePlayPause();
    }
    lastClickTimeRef.current = now;
  };
  
  // --- Controls Visibility ---
  const hideControls = () => {
    if (videoRef.current && !videoRef.current.paused) {
      setShowControls(false);
    }
  };

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  }, []);
  
  useEffect(() => {
    const player = playerRef.current;
    if(player) {
      player.addEventListener('mousemove', resetControlsTimeout);
      player.addEventListener('touchstart', resetControlsTimeout, { passive: true });
    }
    resetControlsTimeout();
    
    return () => {
      if (player) {
        player.removeEventListener('mousemove', resetControlsTimeout);
        player.removeEventListener('touchstart', resetControlsTimeout);
      }
       if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [resetControlsTimeout]);
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={playerRef}
      className="relative aspect-video w-full bg-black overflow-hidden group/player"
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        playsInline
        autoPlay={autoPlay}
        muted={isMuted}
      />
      
      <div ref={adContainerRef} className="absolute inset-0 pointer-events-none" />

       {/* Ad UI Overlay */}
       {isAdPlaying && (
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-transparent pointer-events-none">
              <div className="flex justify-between items-end w-full">
                  <div className="text-white bg-black/50 px-2 py-1 rounded text-sm">{adCountdown}</div>
                  {isAdSkippable && (
                      <Button
                          onClick={skipAd}
                          className="bg-black/50 text-white hover:bg-black/75 pointer-events-auto"
                      >
                          Skip Ad
                      </Button>
                  )}
              </div>
          </div>
      )}
      
      {/* Click overlay for play/pause/skip */}
      <div 
        className="absolute inset-0"
        onClick={!isAdPlaying ? handlePlayerClick : undefined}
      />
      
      {/* Skip feedback */}
       <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300", showSkipFeedback ? "opacity-100" : "opacity-0")}>
        {showSkipFeedback === 'forward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><FastForward className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
        {showSkipFeedback === 'backward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><Rewind className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
      </div>

      {/* Controls Overlay */}
      {!isAdPlaying && (
          <div className={cn(
            "absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity pointer-events-none",
            showControls ? 'opacity-100' : 'opacity-0'
          )}>
            {/* Top controls (empty for now) */}
            <div></div>

            {/* Middle Play/Pause button */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!isPlaying && <div className="bg-black/50 rounded-full p-4"><Play className="w-16 h-16 text-white" fill="white"/></div>}
            </div>

            {/* Bottom controls */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className="flex items-center gap-2 text-white text-xs">
                <span>{formatTime(progress)}</span>
                <Slider
                  min={0}
                  max={duration}
                  step={1}
                  value={[progress]}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                  </button>
                  <div className="flex items-center gap-2 group/volume">
                      <button onClick={toggleMute}>
                          {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                      </button>
                      <div className="w-24 opacity-0 group-hover/volume:opacity-100 transition-opacity">
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[volume]}
                            onValueChange={handleVolumeChange}
                          />
                      </div>
                  </div>
                </div>
                <button onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="w-6 h-6 text-white" /> : <Maximize className="w-6 h-6 text-white" />}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
CustomVideoPlayer.displayName = "CustomVideoPlayer";
