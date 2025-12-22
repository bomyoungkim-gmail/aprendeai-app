'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Download, TrendingUp } from 'lucide-react';

interface ActivityData {
  activityByDate: Record<string, { count: number; minutes: number }>;
  phaseDistribution: { PRE: number; DURING: number; POST: number };
  totalSessions: number;
  periodDays: number;
}

export function SessionAnalytics() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const response = await api.get('/sessions/analytics?days=30');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportSessions(format: 'csv' | 'json') {
    try {
      const response = await api.get(`/sessions/export?format=${format}`);
      
      if (format === 'csv') {
        // Download CSV
        const blob = new Blob([response.data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        a.click();
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sessions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  if (loading || !data) {
    return <div className="text-center py-4">Loading analytics...</div>;
  }

  const maxCount = Math.max(...Object.values(data.activityByDate).map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => exportSessions('csv')}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={() => exportSessions('json')}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Sessions</div>
          <div className="text-2xl font-bold">{data.totalSessions}</div>
          <div className="text-xs text-gray-500">Last {data.periodDays} days</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Most Common Phase</div>
          <div className="text-2xl font-bold">
            {Object.entries(data.phaseDistribution).sort((a, b) => b[1] - a[1])[0][0]}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Avg Sessions/Day</div>
          <div className="text-2xl font-bold">
            {(data.totalSessions / data.periodDays).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity Heatmap
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {Object.entries(data.activityByDate)
            .slice(-28) // Last 4 weeks
            .map(([date, activity]) => {
              const intensity = activity.count / maxCount;
              const bgColor = 
                intensity === 0 ? 'bg-gray-100' :
                intensity < 0.25 ? 'bg-blue-200' :
                intensity < 0.5 ? 'bg-blue-400' :
                intensity < 0.75 ? 'bg-blue-600' : 'bg-blue-800';

              return (
                <div
                  key={date}
                  className={`h-12 rounded ${bgColor} flex items-center justify-center text-xs text-white font-medium`}
                  title={`${date}: ${activity.count} sessions, ${activity.minutes} min`}
                >
                  {activity.count > 0 ? activity.count : ''}
                </div>
              );
            })}
        </div>
      </div>

      {/* Phase Distribution */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Phase Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.phaseDistribution).map(([phase, count]) => (
            <div key={phase}>
              <div className="flex justify-between text-sm mb-1">
                <span>{phase}</span>
                <span className="font-medium">{count} sessions</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(count / data.totalSessions) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
