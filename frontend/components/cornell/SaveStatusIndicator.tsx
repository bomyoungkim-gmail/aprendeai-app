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
  const getStatusConfig = () => {
    switch (status) {
      case 'saved':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'Salvo',
          className: 'text-green-600 dark:text-green-400',
        };
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Salvando...',
          className: 'text-blue-600 dark:text-blue-400',
        };
      case 'offline': // Keeping offline case as it was not explicitly removed by the instruction, only by the snippet
        return {
          icon: <WifiOff className="w-4 h-4" />, // Simplified icon className
          text: 'Offline - changes will sync', // Keeping original text for offline as no Portuguese equivalent was provided
          className: 'text-orange-600 dark:text-orange-400', // New className structure
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Não Salvo',
          className: 'text-red-600 dark:text-red-400',
        };
      default: // Added default case as per snippet
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Não Salvo',
          className: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const display = getStatusConfig(); // Renamed function call

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {display.icon}
      <span className={`text-sm ${display.className}`}>{display.text}</span>
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
