'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function AudioPlayer({ 
  src, 
  duration,
  onTimeUpdate,
  className = ''
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  // Play/Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [playing]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  // Playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const seekPercent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = seekPercent * (duration || audio.duration || 0);
  };

  const audioDuration = duration || audioRef.current?.duration || 0;
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Waveform Placeholder (simple bar for now) */}
      <div className="mb-6">
        <div className="h-20 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded flex items-center justify-center">
          <span className="text-sm text-gray-500">🎵 Audio Waveform</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-4"
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Skip Backward */}
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, currentTime - 10);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => setPlaying(!playing)}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(
                audioDuration,
                currentTime + 10
              );
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Time Display */}
        <span className="text-sm text-gray-700">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>

        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>

        {/* Playback Speed */}
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  );
}
