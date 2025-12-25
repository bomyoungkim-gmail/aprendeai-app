'use client';

import { Flame, Info } from 'lucide-react';
import { clsx } from 'clsx';

type StreakProps = {
  currentStreak: number;
  bestStreak: number;
  freezeTokens: number;
};

export function StreakCard({ currentStreak, bestStreak, freezeTokens }: StreakProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow border border-orange-100 dark:border-orange-900/30">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={clsx(
            "p-3 rounded-full",
            currentStreak > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400"
          )}>
            <Flame size={24} fill={currentStreak > 0 ? "currentColor" : "none"} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentStreak}</div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Dias seguidos</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-400 dark:text-gray-500">Recorde: {bestStreak}</div>
          {freezeTokens > 0 && (
             <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
               ❄️ {freezeTokens} Gelo
             </div>
          )}
        </div>
      </div>
      
      {/* Mini Calendar Visualization - Last 7 days */}
      <div className="px-5 pb-4 flex justify-between space-x-1">
        {[...Array(7)].map((_, i) => {
          // Color bar if it's within the current streak range
          // Bar 0 = 7 days ago, Bar 6 = today
          const daysAgo = 6 - i;
          const isActive = currentStreak > daysAgo;
          
          return (
            <div key={i} className={clsx(
                "h-2 flex-1 rounded-full transition-colors",
                isActive ? "bg-orange-500" : "bg-gray-200"
            )} />
          );
        })}
      </div>
    </div>
  );
}
