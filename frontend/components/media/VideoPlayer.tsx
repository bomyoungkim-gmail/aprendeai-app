'use client';

import { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { AnnotationTimeline } from '@/components/annotations/AnnotationTimeline';
import { TranscriptViewer } from './TranscriptViewer';
import ReactPlayer from 'react-player';

// Cast to any to avoid strict prop validation/ref issues
const Player = ReactPlayer as any;

interface Annotation {
  id: string;
  type: 'HIGHLIGHT' | 'NOTE';
  timestamp: number;
  text?: string;
  color?: string;
}

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface VideoPlayerProps {
  src: string;
  duration?: number;
  onTimeUpdate?: (time: number) => void;
  annotations?: Annotation[];
  transcript?: TranscriptSegment[];
  className?: string;
}

export function VideoPlayer({ 
  src, 
  duration: initialDuration = 0, 
  onTimeUpdate,
  annotations = [],
  transcript = [],
  className = '' 
}: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setInternalDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to toggle internal playing state
  const togglePlay = () => setPlaying(!playing);

  // Handle progress
  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    onTimeUpdate?.(state.playedSeconds);
  };

  // Handle duration
  const handleDuration = (d: number) => {
    console.log('✅ Duration loaded:', d);
    setInternalDuration(d);
  };

  // Handle seek
  const handleSeek = (time: number) => {
    playerRef.current?.seekTo(time, 'seconds');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Prevent SSR render
  if (!isMounted) return null;

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-black rounded-lg aspect-video ${className}`}>
        <p className="text-white">Vídeo não disponível</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black rounded-lg overflow-hidden aspect-video w-full ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Player
          ref={playerRef}
          url={src}
          playing={playing}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="100%"
          height="100%"
          style={{ aspectRatio: '16/9' }}
        />

      {/* Controls Overlay */}
      <div className={`
        absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent
        transition-opacity duration-300
        ${showControls || !playing ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setCurrentTime(time);
              playerRef.current?.seekTo(time, 'seconds');
            }}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
        </div>

        {/* Annotations Timeline */}
        <AnnotationTimeline
           annotations={annotations}
           duration={duration}
           currentTime={currentTime}
           onSeek={handleSeek}
         />

        {/* Buttons */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button 
              onClick={() => {
                const newTime = Math.max(0, currentTime - 10);
                playerRef.current?.seekTo(newTime, 'seconds');
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="-10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button 
              onClick={() => {
                const newTime = Math.min(duration, currentTime + 10);
                playerRef.current?.seekTo(newTime, 'seconds');
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="+10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 group/volume relative">
              <button 
                onClick={() => setMuted(!muted)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                 <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setMuted(false);
                  }}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-black/50 text-white text-sm border border-gray-600 rounded px-2 py-1 outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar: Transcript */}
      {transcript.length > 0 && (
        <div className="absolute right-4 top-4 bottom-20 w-80 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
           <TranscriptViewer
             segments={transcript}
             currentTime={currentTime}
             onSeek={handleSeek}
             className="h-full shadow-lg"
           />
        </div>
      )}
    </div>
  );
}
