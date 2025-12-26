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
import { HourlyPerformanceChart } from '@/components/analytics/HourlyPerformanceChart';
import { QualityOverviewCard } from '@/components/analytics/QualityOverviewCard';
import { useActivityHeatmap, useActivityStats } from '@/hooks/profile';
import { Loader2, BookOpen, Upload } from 'lucide-react';

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

      {/* NEW: Study Quality Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyPerformanceChart days={30} />
        <QualityOverviewCard period="week" />
      </div>

      {isLoading || statsLoading ? (
        <div className="flex h-32 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : (gameStats && activityStats) ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Streak Card - using activityStats for correct values */}
          <StreakCard 
            currentStreak={activityStats.currentStreak} 
            bestStreak={activityStats.longestStreak}
            freezeTokens={gameStats.streak.freezeTokens}
          />

          {/* Daily Goal Card */}
          <DailyGoalCard 
            minutesSpent={gameStats.dailyActivity.minutesSpent}
            goalValue={gameStats.dailyGoal.goalValue}
          />
          
          {/* Helper Card / Continue (Placeholder) */}
          <div className="overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow text-white">
            <div className="p-5 h-full flex flex-col justify-between">
                <div>
                    <div className="font-bold text-lg">Continuar Estudo</div>
                    <div className="text-indigo-100 text-sm mt-1">Nenhuma aula em andamento.</div>
                </div>
                <button className="mt-4 bg-white text-indigo-600 px-4 py-2 rounded font-medium text-sm self-start hover:bg-gray-50">
                    Ir para Biblioteca
                </button>
            </div>
          </div>
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
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
      >
        <Upload className="w-4 h-4" />
        Fazer Upload
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
      const res = await api.get(API_ENDPOINTS.MY_CONTENTS);
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

  if (!contents || contents.length === 0) {
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
      {contents.map((content: any) => (
        <ContentItem key={content.id} content={content} />
      ))}
    </div>
  );
}

