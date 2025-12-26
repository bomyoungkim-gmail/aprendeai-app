"use client";

import { useEffect, useState } from 'react';

import { URLS } from '@/lib/config/urls';

// Define types for our experiment data
type ExperimentStats = {
  total_participants: number;
  [key: string]: number | string;
};

type Experiment = {
  name: string;
  split_ratio: number;
  active: boolean;
  variants: string[];
  stats_mock: ExperimentStats;
};

type ExperimentsResponse = {
  status: string;
  experiments: Record<string, Experiment>;
};

export default function ExperimentsDashboard() {
  const [data, setData] = useState<ExperimentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, use environment variable: process.env.NEXT_PUBLIC_AI_SERVICE_URL
    const API_URL = `${URLS.ai.base}/api/experiments`; 

    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch experiments");
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Erro ao carregar experimentos. Certifique-se que o serviço de IA está rodando na porta 8001.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-900">Dashboard de Experimentação (A/B)</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {data && Object.entries(data.experiments).map(([key, exp]) => (
          <div key={key} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{exp.name}</h3>
                <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{key}</code>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${exp.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {exp.active ? 'ATIVO' : 'PAUSADO'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
                <span>Split Ratio</span>
                <span className="font-medium">{exp.split_ratio * 100}%</span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Variantes & Métricas (Mock)</p>
                <div className="grid grid-cols-2 gap-4">
                  {exp.variants.map((variant, idx) => (
                    <div key={variant} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="font-semibold text-gray-600 mb-1">{variant}</div>
                      {exp.stats_mock && (
                        <div className="text-gray-500 text-xs">
                          {/* Display relevant stats if they exist in mock, simple logic */}
                          {idx === 0 && exp.stats_mock.variant_a && `N: ${exp.stats_mock.variant_a}`}
                          {idx === 1 && exp.stats_mock.variant_b && `N: ${exp.stats_mock.variant_b}`}
                          
                          {idx === 0 && exp.stats_mock.conversion_rate_a && 
                            <div className="text-green-600 font-bold mt-1">Conv: {(Number(exp.stats_mock.conversion_rate_a) * 100).toFixed(1)}%</div>
                          }
                          {idx === 1 && exp.stats_mock.conversion_rate_b && 
                            <div className="text-green-600 font-bold mt-1">Conv: {(Number(exp.stats_mock.conversion_rate_b) * 100).toFixed(1)}%</div>
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4">
                 <p className="text-xs text-gray-400 text-center">Dados baseados em: {exp.stats_mock.total_participants} participações</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
