'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Target, Calendar } from 'lucide-react';

interface HourlyData {
  time_slot: string;
  hour: number;
  minute: number;
  avgAccuracy: number;
  avgFocusScore: number;
  sessionCount: number;
  totalMinutes: number;
}

interface PeakHour {
  time_slot: string;
}

interface HourlyPerformanceData {
  hourlyBreakdown: HourlyData[];
  peakHours: PeakHour[];
  daysAnalyzed: number;
}

export function HourlyPerformanceChart({ days: initialDays = 30 }: { days?: number }) {
  const [data, setData] = useState<HourlyPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(initialDays);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await api.get<HourlyPerformanceData>(
          `/analytics/hourly-performance?days=${selectedDays}`
        );
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch hourly performance:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDays]);

  const toggleDays = () => {
    setSelectedDays(prev => prev === 30 ? 360 : 30);
  };

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
          Frequência de Uso
        </h3>
        <p className="text-gray-500">Comece a estudar para ver seus horários mais ativos!</p>
      </div>
    );
  }

  // Create complete 0:00-23:30 dataset (48 slots) filling missing slots with 0
  const completeData = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const timeSlot = `${h}:${m === 0 ? '00' : '30'}`;
      const existing = data.hourlyBreakdown.find(d => d.time_slot === timeSlot);
      completeData.push({
        time_slot: timeSlot,
        hour: h,
        minute: m,
        label: timeSlot,
        value: existing ? existing.sessionCount : 0,
        isPeak: data.peakHours.some(ph => ph.time_slot === timeSlot) && (existing?.sessionCount || 0) > 0,
      });
    }
  }

  const peakHourLabels = data.peakHours.length > 0 
    ? data.peakHours.map(h => h.time_slot).join(', ')
    : 'N/A';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
            <Clock className="w-5 h-5 text-indigo-600" />
            Frequência de Uso
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
            Horários que você mais interage com o app
            </p>
        </div>
        
        <button 
            onClick={toggleDays}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors"
        >
            <Calendar className="w-3 h-3" />
            {selectedDays === 360 ? 'Últimos 360 Dias' : 'Últimos 30 Dias'}
        </button>
      </div>

      {/* Peak Hours Badge */}
      <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Horários de Pico</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{peakHourLabels}</p>
        </div>
      </div>

      {/* Histogram */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={completeData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={(props) => {
              const { x, y, payload } = props;
              const isFullHour = payload.value.endsWith(':00');
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill={isFullHour ? '#374151' : '#9CA3AF'}
                  fontSize={isFullHour ? 11 : 9}
                  fontWeight={isFullHour ? 600 : 400}
                >
                  {payload.value}
                </text>
              );
            }}
            interval={0}
            height={40}
          />
          <YAxis 
            label={{ value: 'Minutos Ativos', angle: -90, position: 'insideLeft', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-indigo-600">{item.label}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {item.value} {item.value === 1 ? 'minuto' : 'minutos'} de atividade
                    </p>
                    {item.isPeak && (
                       <p className="text-xs text-indigo-500 font-medium mt-1">⭐ Horário mais frequente</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {completeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isPeak ? '#4f46e5' : '#94a3b8'} // Indigo for peak, Slate for others
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Recommendation */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2 items-start">
        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Análise:</strong> O gráfico mostra a distribuição acumulada das suas interações. Use isso para entender sua rotina de estudos.
        </p>
      </div>
    </div>
  );
}
