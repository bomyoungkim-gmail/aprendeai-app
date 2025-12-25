'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';

interface QualityOverview {
  period: number;
  totalSessions: number;
  avgAccuracy: number;
  avgFocusScore: number;
}

export function QualityOverviewCard({ period = 'week' }: { period?: 'week' | 'month' }) {
  const [data, setData] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get<QualityOverview>(
          `/analytics/quality-overview?period=${period}`
        );
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch quality overview:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.totalSessions === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Qualidade de Estudo
        </h3>
        <p className="text-gray-500">Dados insuficientes. Continue estudando!</p>
      </div>
    );
  }

  const focusColor = data.avgFocusScore >= 70 ? 'text-green-600' : data.avgFocusScore >= 50 ? 'text-yellow-600' : 'text-red-600';
  const accuracyColor = data.avgAccuracy >= 80 ? 'text-green-600' : data.avgAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600';

  const focusEmoji = data.avgFocusScore >= 70 ? '🎯' : data.avgFocusScore >= 50 ? '⚡' : '⚠️';
  const accuracyEmoji = data.avgAccuracy >= 80 ? '🏆' : data.avgAccuracy >= 60 ? '📈' : '📉';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-gray-900 dark:text-white">
          <Target className="w-5 h-5 text-indigo-600" />
          Qualidade de Estudo
        </h3>
        <p className="text-sm text-gray-600">
          Últimos {period === 'week' ? '7' : '30'} dias • {data.totalSessions} sessões
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Focus Score */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <span className="text-2xl">{focusEmoji}</span>
            <span className="text-sm font-medium">Foco Médio</span>
          </div>
          <div className={`text-3xl font-bold ${focusColor}`}>
            {data.avgFocusScore.toFixed(0)}%
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {data.avgFocusScore >= 70 ? 'Excelente!' : data.avgFocusScore >= 50 ? 'Pode melhorar' : 'Tente eliminar distrações'}
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <span className="text-2xl">{accuracyEmoji}</span>
            <span className="text-sm font-medium">Taxa de Acerto</span>
          </div>
          <div className={`text-3xl font-bold ${accuracyColor}`}>
            {data.avgAccuracy.toFixed(0)}%
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {data.avgAccuracy >= 80 ? 'Ótimo domínio!' : data.avgAccuracy >= 60 ? 'Bom progresso' : 'Revise mais'}
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.avgFocusScore < 60 && (
        <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <strong>Dica de Foco:</strong> Desative notificações e escolha um ambiente silencioso para estudar.
          </div>
        </div>
      )}

      {data.avgFocusScore >= 70 && data.avgAccuracy >= 80 && (
        <div className="p-3 bg-green-50 rounded-lg flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <strong>Parabéns!</strong> Você está mantendo excelente qualidade de estudo. Continue assim! 🚀
          </div>
        </div>
      )}
    </div>
  );
}
