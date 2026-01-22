"use client";

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind } from 'lucide-react';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface CustomVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const CustomVideoPlayer = forwardRef<{ video: HTMLVideoElement | null }, CustomVideoPlayerProps>(
  ({ src, autoPlay = false }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(autoPlay); // Mute autoplay by default
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipFeedback, setShowSkipFeedback] = useState<'forward' | 'backward' | null>(null);

  const lastClickTimeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    video: videoRef.current
  }));

  // --- Core Playback Logic ---
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setProgress(video.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
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
      player.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- Double Tap to Skip ---
  const handleSkip = useCallback((direction: 'forward' | 'backward') => {
    const video = videoRef.current;
    if (!video) return;
    const skipAmount = 10;
    video.currentTime += (direction === 'forward' ? skipAmount : -skipAmount);
    setShowSkipFeedback(direction);
    setTimeout(() => setShowSkipFeedback(null), 500);
  }, []);

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
      
      {/* Click overlay for play/pause/skip */}
      <div 
        className="absolute inset-0"
        onClick={handlePlayerClick}
      />
      
      {/* Skip feedback */}
       <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300", showSkipFeedback ? "opacity-100" : "opacity-0")}>
        {showSkipFeedback === 'forward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><FastForward className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
        {showSkipFeedback === 'backward' && <div className="flex flex-col items-center bg-black/50 p-4 rounded-full"><Rewind className="w-8 h-8 text-white" /><span className="text-white font-bold">10s</span></div>}
      </div>

      {/* Controls Overlay */}
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
    </div>
  );
});
CustomVideoPlayer.displayName = "CustomVideoPlayer";
