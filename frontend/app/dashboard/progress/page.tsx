'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

type ProgressStats = {
  vocabularySize: number;
  weakPoints: { skill: string; errorCount: number }[];
  strongPoints: { skill: string; successCount: number }[];
};

type VocabularyItem = {
  word: string;
  language: string;
  masteryScore: number;
};

async function fetchStats() {
  const res = await api.get<ProgressStats>('/analytics/progress');
  return res.data;
}

async function fetchVocabulary() {
  const res = await api.get<VocabularyItem[]>('/analytics/vocabulary');
  return res.data;
}

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['progress-stats'],
    queryFn: fetchStats,
  });

  const { data: vocab, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary-list'],
    queryFn: fetchVocabulary,
  });

  if (statsLoading || vocabLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  const maxError = stats?.weakPoints.length ? Math.max(...stats.weakPoints.map(w => w.errorCount)) : 1;
  const maxSuccess = stats?.strongPoints.length ? Math.max(...stats.strongPoints.map(s => s.successCount)) : 1;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Progresso</h1>
        <p className="text-gray-500">Analise seus pontos fortes, fracos e domínio de vocabulário.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WEAK POINTS CARD */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-red-50 dark:border-red-900/30">
           <div className="flex items-center space-x-2 mb-4 text-red-600">
             <AlertTriangle size={20} />
             <h2 className="font-semibold text-lg">Pontos a Melhorar</h2>
           </div>
           
           <div className="space-y-4">
             {stats?.weakPoints.length === 0 ? (
                <p className="text-gray-400 italic">Nenhum ponto fraco identificado ainda.</p>
             ) : (
                stats?.weakPoints.map(point => (
                    <div key={point.skill}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{point.skill}</span>
                            <span className="text-gray-500">{point.errorCount} erros</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-red-400 h-2 rounded-full" 
                                style={{ width: `${(point.errorCount / maxError) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))
             )}
           </div>
        </div>

        {/* STRONG POINTS CARD */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-green-50 dark:border-green-900/30">
           <div className="flex items-center space-x-2 mb-4 text-green-600">
             <TrendingUp size={20} />
             <h2 className="font-semibold text-lg">Pontos Fortes</h2>
           </div>
           
           <div className="space-y-4">
             {stats?.strongPoints.length === 0 ? (
                <p className="text-gray-400 italic">Complete avaliações para descobrir seus pontos fortes.</p>
             ) : (
                stats?.strongPoints.map(point => (
                    <div key={point.skill}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{point.skill}</span>
                            <span className="text-gray-500">{point.successCount} acertos</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${(point.successCount / maxSuccess) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))
             )}
           </div>
        </div>
      </div>

      {/* VOCABULARY MASTERY */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-blue-50 dark:border-blue-900/30">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-blue-600">
                <BookOpen size={20} />
                <h2 className="font-semibold text-lg">Vocabulário Dominado</h2>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {stats?.vocabularySize || 0} palavras
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {vocab?.length === 0 ? (
                <p className="text-gray-400 italic">Nenhuma palavra registrada no seu vocabulário ainda.</p>
            ) : (
                vocab?.map((item) => (
                    <div 
                        key={item.word} 
                        className="px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:scale-105 cursor-default"
                        style={{
                            backgroundColor: `rgba(37, 99, 235, ${0.05 + (item.masteryScore/100) * 0.2})`,
                            borderColor: `rgba(37, 99, 235, ${0.2 + (item.masteryScore/100) * 0.5})`,
                            color: '#1e40af'
                        }}
                        title={`Domínio: ${item.masteryScore}%`}
                    >
                        {item.word}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
