import React from 'react';
import { Target, TrendingUp, Flame, Award } from 'lucide-react';

interface StudyQualityCardProps {
  stats: {
    averageFocus: number;
    accuracyRate: number;
    currentStreak: number;
    dailyGoalProgress: number;
    dailyGoalTarget: number;
  };
  period?: string;
}

export function StudyQualityCard({ stats, period = '7 dias' }: StudyQualityCardProps) {
  const { averageFocus, accuracyRate, currentStreak, dailyGoalProgress, dailyGoalTarget } = stats;
  
  // Calculate remaining minutes for goal
  const remainingMinutes = Math.max(0, dailyGoalTarget - dailyGoalProgress);
  const goalPercentage = Math.round((dailyGoalProgress / dailyGoalTarget) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Qualidade de Estudo
        </h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Últimos {period} • 14 sessões
      </p>

      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Foco Médio */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Foco Médio</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {averageFocus}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tente eliminar distrações
          </p>
        </div>

        {/* Taxa de Acerto */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Taxa de Acerto</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {accuracyRate}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Revise mais conceitos
          </p>
        </div>

        {/* Dias Seguidos */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Dias Seguidos</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentStreak}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Recorde: 4
          </p>
        </div>

        {/* Meta Diária */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Meta Diária</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {goalPercentage}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {dailyGoalProgress} / {dailyGoalTarget} min
          </p>
        </div>
      </div>

      {/* Focus Tip */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">💡</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Dica de Foco:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Desative notificações e escolha um ambiente silencioso para estudar.
              {remainingMinutes > 0 && ` Faltam ${remainingMinutes} minutos para completar sua meta de hoje!`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
