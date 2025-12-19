'use client';

import { Flame, Trophy, Calendar, Clock } from 'lucide-react';

interface ActivityStatsProps {
  stats: {
    totalDays: number;
    currentStreak: number;
    longestStreak: number;
    avgMinutesPerDay: number;
    thisWeekMinutes: number;
    thisMonthMinutes: number;
  };
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Current Streak */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-orange-600 mb-2">
          <Flame className="w-5 h-5" />
          <span className="text-sm font-medium">Current Streak</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {stats.currentStreak}
        </div>
        <div className="text-xs text-gray-500 mt-1">days</div>
      </div>

      {/* Longest Streak */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-yellow-600 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="text-sm font-medium">Longest Streak</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {stats.longestStreak}
        </div>
        <div className="text-xs text-gray-500 mt-1">days</div>
      </div>

      {/* Total Active Days */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Active Days</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {stats.totalDays}
        </div>
        <div className="text-xs text-gray-500 mt-1">this year</div>
      </div>

      {/* This Week */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">This Week</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {formatTime(stats.thisWeekMinutes)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Avg: {formatTime(stats.avgMinutesPerDay)}/day
        </div>
      </div>
    </div>
  );
}
