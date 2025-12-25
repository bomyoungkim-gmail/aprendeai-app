'use client';

import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import api from '@/lib/api';

interface DailyGoalCardProps {
  minutesSpent?: number;
  goalValue?: number;
}

export function DailyGoalCard({ minutesSpent = 0, goalValue = 90 }: DailyGoalCardProps) {
  // Fetch goal achievement statistics
  const { data: achievementStats } = useQuery({
    queryKey: ['goal-achievements'],
    queryFn: async () => {
      const response = await api.get('/gamification/goal-achievements');
      return response.data as { totalAchievements: number };
    },
  });

  const progress = Math.min((minutesSpent / goalValue) * 100, 100);
  const remaining = Math.max(goalValue - minutesSpent, 0);
  const isGoalMet = minutesSpent >= goalValue;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Target className={`h-6 w-6 ${isGoalMet ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meta Diária</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {minutesSpent} / {goalValue} min
            </p>
          </div>
        </div>
        {achievementStats && (
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{achievementStats.totalAchievements}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">vezes atingiu</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalMet 
                ? 'bg-green-500 dark:bg-green-400' 
                : 'bg-indigo-500 dark:bg-indigo-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        {isGoalMet 
          ? '🎉 Meta atingida hoje!' 
          : `Faltam ${remaining} minutos para completar.`
        }
      </p>
    </div>
  );
}
