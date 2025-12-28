'use client';

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useAutoTrackVideo } from '@/hooks/shared/use-auto-track';

interface VideoPlayerWithTrackingProps {
  contentId: string;
  url: string;
  onTimeUpdate?: (time: number) => void;
}

export function VideoPlayerWithTracking({
  contentId,
  url,
  onTimeUpdate,
}: VideoPlayerWithTrackingProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;

  // Auto-track video watch time
  useAutoTrackVideo(contentId, playing);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
    onTimeUpdate?.(state.playedSeconds);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <Player
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="auto"
        onDuration={setDuration}
        onProgress={handleProgress}
        progressInterval={1000}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={played}
          onChange={handleSeek}
          className="w-full mb-2 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  setMuted(newVolume === 0);
                }}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Time */}
            <span className="text-sm">
              {formatTime(played * duration)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={() => {
              const elem = playerRef.current?.getInternalPlayer();
              if (elem?.requestFullscreen) {
                elem.requestFullscreen();
              }
            }}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
