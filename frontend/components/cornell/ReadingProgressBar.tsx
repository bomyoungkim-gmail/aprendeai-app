import React from 'react';

interface ReadingProgressBarProps {
  progress: number;
  className?: string;
}

export function ReadingProgressBar({ progress, className = '' }: ReadingProgressBarProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 h-1 z-50 bg-gray-200 dark:bg-gray-700 ${className}`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
