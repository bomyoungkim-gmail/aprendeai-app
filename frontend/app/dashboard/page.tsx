'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { StreakCard } from '@/components/streak-card';
import { DailyGoalCard } from '@/components/daily-goal-card';
import { ContentItem } from '@/components/content-item';
import { ContentUploadModal } from '@/components/content/ContentUploadModal';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { ActivityStats } from '@/components/dashboard/ActivityStats';
import { StudyQualityCard } from '@/components/dashboard/StudyQualityCard';
import { HourlyPerformanceChart } from '@/components/analytics/HourlyPerformanceChart';
import { useActivityHeatmap, useActivityStats } from '@/hooks/profile';
import { Loader2, BookOpen, Upload } from 'lucide-react';
import { BadgesCard } from '@/components/badges-card';

type GamificationData = {
  dailyActivity: {
    minutesSpent: number;
    lessonsCompleted: number;
    goalMet: boolean;
  };
  dailyGoal: {
    goalType: 'MINUTES' | 'LESSONS';
    goalValue: number;
  };
  streak: {
    currentStreak: number;
    bestStreak: number;
    freezeTokens: number;
  };
  recentBadges: Array<{
    badge_id: string;
    awarded_at: string;
    badges: {
      id: string;
      name: string;
      description: string;
      icon_url?: string;
      category?: string;
    };
  }>;
};

async function fetchGamification() {
  const res = await api.get<GamificationData>('/gamification/dashboard');
  return res.data;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  
  // Queries restored - infinite loop fixed!
  const { data: gameStats, isLoading } = useQuery({
    queryKey: ['gamification-dashboard'],
    queryFn: fetchGamification,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  // Activity heatmap and stats
  const { data: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap();
  const { data: activityStats, isLoading: statsLoading } = useActivityStats();

  // NOTE: activityStats has correct streak values, gameStats returns 0
  // So we keep activityStats as-is, no need to merge
  const consolidatedStats = activityStats;

  // Debug logging
  console.log('Dashboard Debug:', {
    hasActivityStats: !!activityStats,
    hasGameStats: !!gameStats,
    activityStreak: activityStats?.currentStreak,
    gameStreak: gameStats?.streak?.currentStreak,
    usingActivityStats: true,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Olá, {user?.name || 'Estudante'}!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Vamos continuar seu progresso hoje?
        </p>
      </div>

      {/* Activity Heatmap Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Sua Atividade de Estudo
        </h3>
        
        {statsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : consolidatedStats ? (
          <ActivityStats stats={consolidatedStats} />
        ) : null}

        {heatmapLoading ? (
          <div className="flex h-32 items-center justify-center mt-6">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : heatmapData ? (
          <div className="mt-6">
            <ActivityHeatmap data={heatmapData} />
          </div>
        ) : null}
      </div>

      {/* Study Quality Section */}
      {activityStats && (
        <StudyQualityCard 
          stats={{
            averageFocus: 0, // TODO: Get from analytics API
            accuracyRate: 0, // TODO: Get from analytics API
            currentStreak: activityStats.currentStreak,
            dailyGoalProgress: gameStats?.dailyActivity?.minutesSpent || 0,
            dailyGoalTarget: gameStats?.dailyGoal?.goalValue || 90,
          }}
          period="7 dias"
        />
      )}

      {/* Hourly Performance Chart */}
      <HourlyPerformanceChart days={30} />

      {isLoading || statsLoading ? (
        <div className="flex h-32 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : (gameStats && activityStats) ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-1 lg:grid-cols-1">
          {/* Badges Card */}
          <BadgesCard badges={gameStats.recentBadges || []} />
        </div>
      ) : (
          <div className="text-gray-500">Não foi possível carregar dados de progresso.</div>
      )}

      {/* Cornell Reader Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Leitor Cornell
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Estude seus conteúdos com o método Cornell de anotações
            </p>
          </div>
          <CornellUploadButton />
        </div>
        <CornellContentsList />
      </div>
    </div>
  );
}

// Cornell Upload Button Component
function CornellUploadButton() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUploadModal(true)}
        className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
        title="Fazer Upload"
      >
        <Upload className="w-5 h-5" />
      </button>

      <ContentUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </>
  );
}

// Cornell Contents List Component
function CornellContentsList() {
  const { data: contents, isLoading } = useQuery({
    queryKey: ['cornell-contents', 'my-contents'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CONTENTS.MY_CONTENTS);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Normalize contents to always be an array
  const items = Array.isArray(contents) ? contents : (contents?.items || []);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum conteúdo disponível
        </h4>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Faça upload do seu primeiro arquivo PDF, DOCX ou outro material de estudo para começar!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((content: any) => (
        <ContentItem key={content.id} content={content} />
      ))}
    </div>
  );
}

