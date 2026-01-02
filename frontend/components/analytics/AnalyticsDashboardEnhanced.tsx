/**
 * Analytics Dashboard Component - Enhanced Version
 * 
 * Following MelhoresPraticas.txt:
 * - UI component apenas
 * - Usa hooks para dados
 * - Sem lógica de negócio
 * 
 * Displays KPIs, charts, heatmaps, and export functionality
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, BookOpen, Download } from 'lucide-react';
import api from '@/services/api';

interface AnalyticsStats {
  activeUsers: number;
  contentsRead: number;
  completionRate: number;
  avgTime: number;
  modeUsage: Record<string, number>;
  confusionHeatmap: Array<{ sectionId: string; count: number }>;
}

export function AnalyticsDashboardEnhanced() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats', dateRange],
    queryFn: async (): Promise<AnalyticsStats> => {
      const response = await api.get('/analytics/stats', {
        params: { range: dateRange }
      });
      return response.data;
    }
  });

  const handleExportCSV = () => {
    if (!stats) return;
    
    const csv = generateCSV(stats);
    downloadFile(csv, 'analytics-export.csv', 'text/csv');
  };

  const handleExportPDF = () => {
    // Would integrate with jsPDF
    alert('PDF export - integração com jsPDF pendente');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Analytics Dashboard
        </h1>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Usuários Ativos"
          value={stats.activeUsers.toLocaleString()}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Conteúdos Lidos"
          value={stats.contentsRead.toLocaleString()}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Taxa de Conclusão"
          value={`${stats.completionRate}%`}
          trend="+5%"
          trendUp={true}
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Tempo Médio"
          value={`${stats.avgTime}min`}
          trend="-2%"
          trendUp={false}
        />
      </div>

      {/* Mode Usage Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Uso por Modo
        </h2>
        <div className="space-y-3">
          {Object.entries(stats.modeUsage).map(([mode, count]) => (
            <div key={mode}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {mode}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {count} leituras
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(count / Math.max(...Object.values(stats.modeUsage))) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confusion Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Heatmap de Confusão
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Seções com maior número de sinais de confusão
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.confusionHeatmap.map((item) => (
            <div
              key={item.sectionId}
              className={`p-4 rounded-lg text-center ${
                item.count > 10
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : item.count > 5
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {item.sectionId}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {item.count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ icon, title, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        <span className={`text-sm font-medium ${
          trendUp ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend}
        </span>
      </div>
      <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

/**
 * Generate CSV from stats
 */
function generateCSV(stats: AnalyticsStats): string {
  const rows = [
    ['Métrica', 'Valor'],
    ['Usuários Ativos', stats.activeUsers.toString()],
    ['Conteúdos Lidos', stats.contentsRead.toString()],
    ['Taxa de Conclusão', `${stats.completionRate}%`],
    ['Tempo Médio', `${stats.avgTime}min`],
    [''],
    ['Modo', 'Leituras'],
    ...Object.entries(stats.modeUsage).map(([mode, count]) => [mode, count.toString()])
  ];

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
