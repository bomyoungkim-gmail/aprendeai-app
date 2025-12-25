'use client';

import { Flame, Trophy, Calendar, Clock, BookMarked } from 'lucide-react';

interface ActivityStatsProps {
  stats: {
    totalDays: number;
    activeTopics?: number; // Optional for backward compatibility
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

  // Helper to get recommendation message
  const getTopicsRecommendation = (count?: number) => {
    if (count === undefined) return '';
    if (count === 0) return 'Comece a estudar!';
    if (count >= 2 && count <= 3) return 'Foco ideal 🎯';
    if (count === 1) return 'Varie um pouco mais';
    return 'Muitos tópicos';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Topics (replaces Current Streak) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <BookMarked className="w-5 h-5" />
          <span className="text-sm font-medium">Tópicos Ativos</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {stats.activeTopics ?? 0}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getTopicsRecommendation(stats.activeTopics)}
        </div>
      </div>

      {/* Longest Streak */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-yellow-600 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="text-sm font-medium">Maior Sequência</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.longestStreak}
        </div>
        <div className="text-xs text-gray-500 mt-1">dias</div>
      </div>

      {/* Total Active Days */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Dias Ativos</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.totalDays}
        </div>
        <div className="text-xs text-gray-500 mt-1">este ano</div>
      </div>

      {/* This Week */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Esta Semana</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatTime(stats.thisWeekMinutes)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Média: {formatTime(stats.avgMinutesPerDay)}/dia
        </div>
      </div>
    </div>
  );
}
