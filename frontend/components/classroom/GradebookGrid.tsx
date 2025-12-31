'use client';

import React, { useMemo } from 'react';
import { useGradebook } from '@/hooks/content/use-classrooms';
import { Users, BookOpen, LayoutDashboard, Loader2 } from 'lucide-react';

interface GradebookGridProps {
  classroomId: string;
}

export function GradebookGrid({ classroomId }: GradebookGridProps) {
  const { data: grid, isLoading, error } = useGradebook(classroomId);

  const stats = useMemo(() => {
    if (!grid?.data.length) return null;
    
    let totalScore = 0;
    let count = 0;
    
    grid.data.forEach(row => {
      Object.values(row.scores).forEach(score => {
        totalScore += score;
        count++;
      });
    });

    return {
      average: count > 0 ? (totalScore / count).toFixed(1) : '0',
      studentCount: grid.data.length,
      itemCount: grid.contentIds.length
    };
  }, [grid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !grid) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
        Falha ao carregar o diário de classe.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Média da Turma</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.average}%</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Alunos Ativos</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.studentCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Conteúdos</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.itemCount}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Desempenho por Aluno</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">Aluno</th>
                {grid.contentIds.map((cId) => (
                  <th key={cId} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    <span className="truncate block max-w-[100px]" title={cId}>{cId.substring(0, 8)}...</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {grid.data.length === 0 ? (
                <tr>
                  <td colSpan={grid.contentIds.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                    Nenhum dado disponível ainda.
                  </td>
                </tr>
              ) : (
                grid.data.map((row) => (
                  <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                        </div>
                        {/* TODO: ROADMAP - Action menu for student management (e.g., Unenroll) */}
                      </div>
                    </td>
                    {grid.contentIds.map((cId) => {
                      const score = row.scores[cId];
                      return (
                        <TableCell key={cId} score={score} />
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TableCell({ score }: { score?: number }) {
  if (score === undefined) {
    return <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">-</td>;
  }

  const bgColor = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <td className="px-6 py-4 whitespace-nowrap text-center">
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${bgColor}`}>
        {score}%
      </span>
    </td>
  );
}
