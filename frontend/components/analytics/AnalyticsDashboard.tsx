import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { useSessionAnalytics } from '@/hooks/analytics/use-analytics';
import { StatCard } from './StatCard';
import { Clock, MousePointerClick,  Highlighter, FileText, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  contentId: string;
}

export function AnalyticsDashboard({ contentId }: AnalyticsDashboardProps) {
  const { data: metrics, isLoading } = useSessionAnalytics(contentId);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500 animate-pulse">Carregando estatísticas...</div>;
  }

  if (!metrics) return null;

  // Format time (ms -> min)
  const timeMinutes = Math.round(metrics.totalTimeMs / 1000 / 60);
  
  // Data for Charts
  const interactionData = [
    { name: 'Evidências', value: metrics.highlightsCount, color: '#facc15' }, // Yellow-400
    { name: 'Vocabulário', value: metrics.notesCount, color: '#3b82f6' }, // Blue-500
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics de Aprendizagem</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Tempo Total" 
          value={`${timeMinutes} min`} 
          icon={Clock} 
          description="Foco total neste conteúdo"
        />
        <StatCard 
          title="Profundidade" 
          value={`${Math.round(metrics.scrollDepth)}%`} 
          icon={MousePointerClick} 
          description="Progresso de leitura vertical"
        />
         <StatCard 
          title="Evidências" 
          value={metrics.highlightsCount} 
          icon={Highlighter} 
          description="Passagens importantes marcadas"
        />
        <StatCard 
          title="Vocabulário / Reflexão" 
          value={metrics.notesCount} 
          icon={FileText} 
          description="Notas e dúvidas registradas"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Interaction Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Engajamento</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interactionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {interactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mode Distribution (Placeholder/Visual) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
             <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 w-full text-left">Modo Dominante</h3>
             <div className="flex-1 flex flex-col items-center justify-center gap-2">
                 <div className="text-5xl">
                    {metrics.dominantMode === 'NARRATIVE' ? '📖' : 
                     metrics.dominantMode === 'DIDACTIC' ? '👨‍🏫' : '🧠'}
                 </div>
                 <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    {metrics.dominantMode}
                 </span>
                 <p className="text-xs text-center text-gray-400 max-w-[200px]">
                    Você passou a maior parte do tempo neste modo de leitura.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
}
