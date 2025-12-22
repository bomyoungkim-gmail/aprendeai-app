'use client';

import { useQuery } from '@tanstack/react-query';
import { DailyGoalCard } from '../daily-goal-card';
import { WhatsNextSection } from './WhatsNextSection';
import { ContextCardsContainer } from '../context-cards/ContextCardsContainer';
import ROUTES from '@/lib/api-routes';

interface OpsDashboardProps {
  userId: string;
}

export function OpsDashboard({ userId }: OpsDashboardProps) {
  const { data: snapshot, isLoading } = useQuery({
    queryKey: ['ops-daily', userId],
    queryFn: async () => {
      const response = await fetch(ROUTES.OPS.DAILY_SNAPSHOT, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch snapshot');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="space-y-6">
      {/* Reuse existing DailyGoalCard */}
      <DailyGoalCard
        goalType="MINUTES"
        goalValue={snapshot.goals.dailyMinutes}
        progress={snapshot.progress.minutesToday}
        goalMet={snapshot.progress.goalMet}
      />

      {/* What's Next Section */}
      <WhatsNextSection tasks={snapshot.nextTasks} />

      {/* Context Cards */}
      <ContextCardsContainer userId={userId} />
    </div>
  );
}
