'use client';

import { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { useAutoTrackVideo } from '@/hooks/use-auto-track';

interface AudioPlayerWithTrackingProps {
  contentId: string;
  url: string;
  onTimeUpdate?: (time: number) => void;
}

export function AudioPlayerWithTracking({
  contentId,
  url,
  onTimeUpdate,
}: AudioPlayerWithTrackingProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;

  // Auto-track audio listen time (using same hook as video)
  useAutoTrackVideo(contentId, playing);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
    onTimeUpdate?.(state.playedSeconds);
  };

  const handleSeek = (seconds: number) => {
    const currentTime = played * duration;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    const newPlayed = newTime / duration;
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 shadow-lg">
      <Player
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="0"
        height="0"
        onDuration={setDuration}
        onProgress={handleProgress}
        progressInterval={1000}
      />

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={played}
            onChange={(e) => {
              const newPlayed = parseFloat(e.target.value);
              setPlayed(newPlayed);
              playerRef.current?.seekTo(newPlayed);
            }}
            className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-white text-sm">
            <span>{formatTime(played * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Skip Back */}
          <button
            onClick={() => handleSeek(-10)}
            className="p-3 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <SkipBack className="h-6 w-6" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-4 bg-white text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            {playing ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => handleSeek(10)}
            className="p-3 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <SkipForward className="h-6 w-6" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
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
            className="w-32 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
