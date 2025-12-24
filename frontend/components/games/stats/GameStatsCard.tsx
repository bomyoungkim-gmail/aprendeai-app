'use client';

import { ActivityStats } from '@/components/dashboard/ActivityStats';

interface GameStatsCardProps {
  totalStars: number;
  currentStreak: number;
  gamesPlayed: number;
  avgScore: number;
}

/**
 * Game stats card - Wrapper around existing ActivityStats
 * REUSES dashboard component for consistency
 */
export function GameStatsCard({ totalStars, currentStreak, gamesPlayed, avgScore }: GameStatsCardProps) {
  // Adapt game stats to ActivityStats format
  const adaptedStats = {
    totalDays: gamesPlayed, // Maps games played to "active days"
    currentStreak,
    longestStreak: currentStreak, // Could track separately
    avgMinutesPerDay: avgScore, // Maps to avg score
    thisWeekMinutes: totalStars, // Reuse for total stars
    thisMonthMinutes: totalStars,
  };

  return <ActivityStats stats={adaptedStats} />;
}
