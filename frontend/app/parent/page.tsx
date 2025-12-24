"use client";

import { useEffect, useState } from 'react';

type Child = {
  user_id: string;
  name: string;
  age: number;
  grade: string;
};

type ChildProgress = {
  child: { user_id: string; name: string; grade: string };
  summary: { engagement_level: string; current_streak: number; level: number; total_games: number };
  achievements: { badges: number; best_streak: number; avg_score: number };
  learning_insights: { strengths: string[]; needs_practice: string[]; recommendations: string[] };
  time_analytics: { total_minutes: number; avg_per_day: number; trend: string };
};

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock parent ID - get from auth in production
  const parentId = "parent_123";
import { urls } from '@/lib/config/urls';
  const API_URL = urls.api.base;

  useEffect(() => {
    fetch(`${API_URL}/parent/children/${parentId}`)
      .then(res => res.json())
      .then(data => {
        setChildren(data.children || []);
        if (data.children?.length > 0) {
          setSelectedChildId(data.children[0].user_id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching children:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;

    fetch(`${API_URL}/parent/child/${selectedChildId}/progress?parent_id=${parentId}`)
      .then(res => res.json())
      .then(data => setProgress(data))
      .catch(err => console.error("Error fetching progress:", err));
  }, [selectedChildId]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-indigo-900">Painel dos Pais</h1>

      {/* Child Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecione seu filho(a)</label>
        <select
          value={selectedChildId || ""}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          {children.map(child => (
            <option key={child.user_id} value={child.user_id}>
              {child.name} - {child.grade}
            </option>
          ))}
        </select>
      </div>

      {progress && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium mb-1 opacity-90">Engajamento</h3>
              <p className="text-3xl font-bold">{progress.summary.engagement_level}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium mb-1 opacity-90">Ofensiva Atual</h3>
              <p className="text-3xl font-bold">🔥 {progress.summary.current_streak} dias</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium mb-1 opacity-90">Nível</h3>
              <p className="text-3xl font-bold">{progress.summary.level}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium mb-1 opacity-90">Média Geral</h3>
              <p className="text-3xl font-bold">{progress.achievements.avg_score}%</p>
            </div>
          </div>

          {/* Learning Insights */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🌟 Pontos Fortes</h3>
              <ul className="space-y-2">
                {progress.learning_insights.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-center text-green-700">
                    <span className="mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📚 Precisa Praticar</h3>
              <ul className="space-y-2">
                {progress.learning_insights.needs_practice.map((area, idx) => (
                  <li key={idx} className="flex items-center text-yellow-700">
                    <span className="mr-2">⚠</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Time Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">⏱️ Tempo de Estudo</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total do Mês</p>
                <p className="text-2xl font-bold text-gray-900">{progress.time_analytics.total_minutes} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Média Diária</p>
                <p className="text-2xl font-bold text-gray-900">{progress.time_analytics.avg_per_day} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tendência</p>
                <p className="text-2xl font-bold text-green-600 capitalize">{progress.time_analytics.trend}</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Recomendações para Pais</h3>
            <ul className="space-y-2">
              {progress.learning_insights.recommendations.map((rec, idx) => (
                <li key={idx} className="text-blue-800">{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
