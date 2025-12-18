'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StreakCard } from '@/components/streak-card';
import { DailyGoalCard } from '@/components/daily-goal-card';
import { ContentItem } from '@/components/content-item';
import { Loader2, BookOpen } from 'lucide-react';

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
  
  const { data: gameStats, isLoading } = useQuery({
    queryKey: ['gamification-dashboard'],
    queryFn: fetchGamification,
    refetchInterval: 60000, // Refresh every minute
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

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : gameStats ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Streak Card */}
          <StreakCard 
            currentStreak={gameStats.streak.currentStreak} 
            bestStreak={gameStats.streak.bestStreak}
            freezeTokens={gameStats.streak.freezeTokens}
          />

          {/* Daily Goal Card */}
          <DailyGoalCard 
            goalType={gameStats.dailyGoal.goalType}
            goalValue={gameStats.dailyGoal.goalValue}
            progress={
                gameStats.dailyGoal.goalType === 'MINUTES' 
                ? gameStats.dailyActivity.minutesSpent 
                : gameStats.dailyActivity.lessonsCompleted
            }
            goalMet={gameStats.dailyActivity.goalMet}
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
          <div className="text-gray-500">Não foi possível carregar os dados de progresso.</div>
      )}

      {/* Cornell Reader Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Cornell Reader</h3>
            <p className="text-sm text-gray-500 mt-1">
              Estude seus conteúdos com o método Cornell de anotações
            </p>
          </div>
        </div>

        <CornellReaderSection />
      </div>
    </div>
  );
}

// Cornell Reader Section Component
function CornellReaderSection() {
  const { data: contents, isLoading } = useQuery({
    queryKey: ['cornell-contents'],
    queryFn: async () => {
      const res = await api.get('/contents/my-contents');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contents || contents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">
          Nenhum conteúdo disponível
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contents.slice(0, 6).map((content: any) => (
        <ContentItem key={content.id} content={content} />
      ))}
    </div>
  );
}
