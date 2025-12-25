'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Target } from 'lucide-react';

interface HourlyData {
  hour: number;
  avgAccuracy: number;
  avgFocusScore: number;
  sessionCount: number;
  totalMinutes: number;
}

interface HourlyPerformanceData {
  hourlyBreakdown: HourlyData[];
  peakHours: number[];
  daysAnalyzed: number;
}

export function HourlyPerformanceChart({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<HourlyPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get<HourlyPerformanceData>(
          `/analytics/hourly-performance?days=${days}`
        );
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch hourly performance:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!data || data.hourlyBreakdown.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Horário de Pico
        </h3>
        <p className="text-gray-500">Comece a estudar para ver seus horários de melhor desempenho!</p>
      </div>
    );
  }

  const chartData = data.hourlyBreakdown.map((item) => ({
    ...item,
    label: `${item.hour}h`,
    score: Math.round((item.avgFocusScore + item.avgAccuracy) / 2), // Combined score
    isPeak: data.peakHours.includes(item.hour),
  }));

  const peakHourLabels = data.peakHours.map(h => `${h}h`).join(', ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
          <Clock className="w-5 h-5 text-indigo-600" />
          Desempenho por Horário
        </h3>
        <p className="text-sm text-gray-600">
          Últimos {data.daysAnalyzed} dias
        </p>
      </div>

      {/* Peak Hours Badge */}
      <div className="mb-4 p-3 bg-indigo-50 rounded-lg flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-600" />
        <div>
          <p className="text-sm font-medium text-indigo-900">Seus Horários de Pico</p>
          <p className="text-lg font-bold text-indigo-600">{peakHourLabels}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'Qualidade (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload as typeof chartData[0];
                return (
                  <div className="bg-white p-3 shadow-lg rounded-lg border">
                    <p className="font-semibold">{data.label}</p>
                    <p className="text-sm text-gray-600">
                      {data.sessionCount} sessões • {data.totalMinutes}min
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-green-600">Foco:</span> {data.avgFocusScore.toFixed(0)}%
                      </p>
                      <p className="text-sm">
                        <span className="text-blue-600">Acertos:</span> {data.avgAccuracy.toFixed(0)}%
                      </p>
                    </div>
                    {data.isPeak && (
                      <p className="text-xs text-indigo-600 font-medium mt-2">⭐ Horário de Pico</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isPeak ? '#4f46e5' : entry.score > 70 ? '#10b981' : '#f59e0b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-indigo-600"></div>
          <span>Pico</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Bom (\u003e70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500"></div>
          <span>Moderado</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          <strong>Dica:</strong> Estude tópicos difíceis nos seus horários de pico para melhor retenção!
        </p>
      </div>
    </div>
  );
}
