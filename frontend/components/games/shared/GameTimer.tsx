'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface GameTimerProps {
  duration: number; // seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}

/**
 * Reusable countdown timer for timed games
 */
export function GameTimer({ duration, onTimeUp, autoStart = true }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 10;

  return (
    <div className="flex items-center gap-2">
      <Clock className={`h-5 w-5 ${isLow ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isLow ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
