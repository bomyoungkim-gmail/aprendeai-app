import React from 'react';
import { Check, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import type { SaveStatus } from '@/lib/types/cornell';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  className = '',
}: SaveStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saved':
        return {
          icon: <Check className="h-4 w-4 text-green-600" />,
          text: lastSaved
            ? `Saved ${getTimeAgo(lastSaved)}`
            : 'All changes saved',
          textColor: 'text-green-700',
        };
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
          text: 'Saving...',
          textColor: 'text-blue-700',
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4 text-orange-600" />,
          text: 'Offline - changes will sync',
          textColor: 'text-orange-700',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          text: 'Failed to save',
          textColor: 'text-red-700',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {display.icon}
      <span className={`text-sm ${display.textColor}`}>{display.text}</span>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
