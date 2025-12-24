"use client";

import { useEffect, useState } from 'react';

// Note: In production, install recharts: npm install recharts
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AnalyticsDashboard() {
  const [learningCurve, setLearningCurve] = useState<any>(null);
  const [skillHeatmap, setSkillHeatmap] = useState<any>(null);
  const [predictive, setPredictive] = useState<any>(null);

  const userId = "student_123";  // Get from auth
import { urls } from '@/lib/config/urls';
  const API_URL = urls.ai.base + "/api";

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/analytics/learning-curve/${userId}?topic=Matemática&days=14`).then(r => r.json()),
      fetch(`${API_URL}/analytics/skill-heatmap/${userId}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/predictive/${userId}`).then(r => r.json())
    ])
      .then(([curve, heatmap, insights]) => {
        setLearningCurve(curve);
        setSkillHeatmap(heatmap);
        setPredictive(insights);
      })
      .catch(err => console.error("Error fetching analytics:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-900">Analytics Avançado</h1>

      {/* Learning Curve */}
      {learningCurve && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">📈 Curva de Aprendizado - {learningCurve.topic}</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Tendência</p>
              <p className="text-2xl font-bold text-blue-600 capitalize">{learningCurve.trend}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Média</p>
              <p className="text-2xl font-bold text-green-600">{learningCurve.avg_score.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Taxa de Melhoria</p>
              <p className="text-2xl font-bold text-purple-600">{learningCurve.improvement_rate}</p>
            </div>
          </div>
          
          {/* Simple line chart placeholder */}
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center border-2 border-d ashed border-gray-300">
            <p className="text-gray-500">
              📊 Gráfico de linha seria renderizado aqui com Recharts
              <br />
              <span className="text-sm">(dados disponíveis em learningCurve.data_points)</span>
            </p>
          </div>
        </div>
      )}

      {/* Skill Heatmap */}
      {skillHeatmap && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">🎯 Mapa de Habilidades</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Tópico</th>
                  {skillHeatmap.skills.map((skill: string) => (
                    <th key={skill} className="px-4 py-2 text-center text-sm">{skill}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skillHeatmap.heatmap.map((row: any) => (
                  <tr key={row.topic} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.topic}</td>
                    {skillHeatmap.skills.map((skill: string) => {
                      const score = row.scores[skill];
                      const colorClass = score >= 80 ? 'bg-green-200' : 
                                        score >= 60 ? 'bg-yellow-200' : 'bg-red-200';
                      return (
                        <td key={skill} className="px-4 py-3 text-center">
                          <div className={`${colorClass} rounded px-2 py-1 font-semibold`}>
                            {score}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p><strong>Habilidade Mais Forte:</strong> {skillHeatmap.strongest_skill}</p>
            <p><strong>Habilidade a Desenvolver:</strong> {skillHeatmap.weakest_skill}</p>
          </div>
        </div>
      )}

      {/* Predictive Insights */}
      {predictive && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">🔮 Insights Preditivos</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Probabilidade Retenção (30d)</p>
                <p className="text-2xl font-bold text-green-600">
                  {(predictive.predictions['30_day_retention_probability'] * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Próximo Nível</p>
                <p className="text-2xl font-bold text-blue-600">
                  {predictive.predictions.next_level_eta_days} dias
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">⚡ Oportunidades</h3>
            {predictive.opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="mb-3 p-3 bg-purple-50 rounded">
                <p className="font-medium">{opp.opportunity}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Confiança: {(opp.confidence * 100).toFixed(0)}% | {opp.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
