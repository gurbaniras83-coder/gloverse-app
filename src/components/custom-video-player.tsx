import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind } from 'lucide-react';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, runTransaction, QuerySnapshot, query, where } from "firebase/firestore";

interface AdCampaign {
  id: string;
  videoUrl: string;
  advertiserId: string;
  status: string;
}

interface CustomVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const CustomVideoPlayer = forwardRef<{ video: HTMLVideoElement | null }, CustomVideoPlayerProps>(
  ({ src, autoPlay = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const adBilledRef = useRef(false);

    // Player State
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(autoPlay);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSkipFeedback, setShowSkipFeedback] = useState<'forward' | 'backward' | null>(null);

    // Ad & Content State
    const [playerSrc, setPlayerSrc] = useState<string | null>(null);
    const [isAdMode, setIsAdMode] = useState(true);
    const [contentUrl] = useState(src);
    const [showSkipAdButton, setShowSkipAdButton] = useState(false);
    const [activeAd, setActiveAd] = useState<AdCampaign | null>(null);
    const [showUnmuteButton, setShowUnmuteButton] = useState(false);
    
    const lastClickTimeRef = useRef(0);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      video: videoRef.current
    }));

    const handleBilling = useCallback(async (advertiserId: string) => {
        if (adBilledRef.current) return;
        adBilledRef.current = true;
        
        const advertiserRef = doc(db, "advertisers_accounts", advertiserId);
        try {
            await runTransaction(db, async (transaction) => {
                const advertiserDoc = await transaction.get(advertiserRef);
                if (!advertiserDoc.exists()) {
                    throw "Advertiser document does not exist!";
                }
                const currentBalance = advertiserDoc.data().walletBalance || 0;
                const newBalance = currentBalance - 0.10;
                transaction.update(advertiserRef, { walletBalance: newBalance });
            });
            console.log("Transaction successfully committed for ad play!");
        } catch (e) {
            console.error("Transaction failed: ", e);
            toast({
                variant: "destructive",
                title: "Billing Error",
                description: "Could not process ad payment.",
            });
        }
    }, [toast]);
    
    const handleSkipAd = useCallback(() => {
        if (videoRef.current) {
            setIsAdMode(false);
            videoRef.current.src = contentUrl;
            videoRef.current.load();
            videoRef.current.play().catch(e => console.error("Content play failed after skip", e));
        }
    }, [contentUrl]);

    useEffect(() => {
      const fetchAndPlayAd = async () => {
        try {
          const q = query(collection(db, "ad_campaigns"), where("status", "==", "Active"));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.log("No active ad campaigns found, playing content.");
            handleSkipAd();
            return;
          }

          const ads: AdCampaign[] = [];
          querySnapshot.forEach(doc => {
              ads.push({ id: doc.id, ...doc.data() } as AdCampaign);
          });

          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          
          setActiveAd(randomAd);
          setPlayerSrc(randomAd.videoUrl);
          setIsAdMode(true);
          adBilledRef.current = false;
          setShowSkipAdButton(false);
          
        } catch (error) {
          console.warn("Ad fetch error, playing content directly:", error);
          handleSkipAd();
        }
      };
      
      fetchAndPlayAd();
    }, [contentUrl, handleSkipAd]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (isAdMode && playerSrc && video) {
            video.src = playerSrc;
            video.load();
            video.muted = false; 
            setIsMuted(false);
            const playPromise = video.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Ad playback requires user interaction to enable sound.");
                    setIsMuted(true);
                    setShowUnmuteButton(true);
                    video.muted = true;
                    video.play().catch(e => console.error("Muted ad playback failed", e));
                });
            }
        }
    }, [isAdMode, playerSrc]);


    const handleVideoEnd = () => {
      if (isAdMode) {
        handleSkipAd();
      }
    };
    
    const handleUnmute = () => {
        const video = videoRef.current;
        if(video) {
            video.muted = false;
            setIsMuted(false);
            setShowUnmuteButton(false);
        }
    }

    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video || isAdMode) return;

        if (video.paused) {
          video.play().catch(error => console.log('Playback was safely handled'));
        } else {
          video.pause();
        }
    }, [isAdMode]);

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;

      setProgress(video.currentTime);

      if (isAdMode && activeAd) {
          if (video.currentTime >= 5 && !adBilledRef.current) {
              handleBilling(activeAd.advertiserId);
              setShowSkipAdButton(true);
          }
      }
    };

    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (video) {
        setDuration(video.duration);
      }
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
      if (!video.muted) {
          setShowUnmuteButton(false);
      }
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
        setShowUnmuteButton(false);
      }
    };

    const handleSeek = (value: number[]) => {
      const video = videoRef.current;
      if (!video || isAdMode) return;
      video.currentTime = value[0];
      setProgress(value[0]);
    };

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
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleSkip = useCallback((direction: 'forward' | 'backward') => {
      if (isAdMode) return;
      const video = videoRef.current;
      if (!video) return;
      const skipAmount = 10;
      video.currentTime += (direction === 'forward' ? skipAmount : -skipAmount);
      setShowSkipFeedback(direction);
      setTimeout(() => setShowSkipFeedback(null), 500);
    }, [isAdMode]);

    const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const now = new Date().getTime();
      if (now - lastClickTimeRef.current < 300) { 
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX > rect.width / 2) {
          handleSkip('forward');
        } else {
          handleSkip('backward');
        }
      } else { 
        togglePlayPause();
      }
      lastClickTimeRef.current = now;
    };

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
      if(!isAdMode){
         controlsTimeoutRef.current = setTimeout(hideControls, 3000);
      }
    }, [isAdMode]);

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
          className="h-full w-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnd}
          playsInline
          autoPlay={autoPlay}
        />

        {isAdMode && (
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-transparent pointer-events-none">
                 <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-1 rounded backdrop-blur-sm">
                    Sponsored
                </div>
                {showUnmuteButton && (
                    <div className="absolute top-4 right-4 pointer-events-auto">
                        <Button onClick={handleUnmute} className="bg-black/50 text-white hover:bg-black/75 backdrop-blur-sm">
                            <VolumeX className="w-5 h-5 mr-2"/> Unmute
                        </Button>
                    </div>
                )}
                <div className="flex-grow"></div>
                <div className="flex justify-end items-end w-full">
                    {showSkipAdButton && (
                        <Button
                            onClick={handleSkipAd}
                            className="bg-black/50 text-white hover:bg-black/75 pointer-events-auto backdrop-blur-sm"
                        >
                            Skip Ad
                        </Button>
                    )}
                </div>
            </div>
        )}

        <div
          className="absolute inset-0"
          onClick={!isAdMode ? handlePlayerClick : undefined}
        />

         <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300", showSkipFeedback ? "opacity-100" : "opacity-0")}>
          {showSkipFeedback === 'forward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><FastForward className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
          {showSkipFeedback === 'backward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><Rewind className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
        </div>

        {!isAdMode && (
            <div className={cn(
              "absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity pointer-events-none",
              showControls ? 'opacity-100' : 'opacity-0'
            )}>
              <div></div>

              <div className="absolute inset-0 flex items-center justify-center">
                {!isPlaying && <div className="bg-black/50 rounded-full p-4"><Play className="w-16 h-16 text-white" fill="white" /></div>}
              </div>

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