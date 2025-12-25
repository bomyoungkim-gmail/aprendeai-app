'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { FileText, Clock, BarChart2, ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config/routes';

interface Assessment {
  id: string;
  createdAt: string;
  content: {
    title: string;
  };
  _count: {
    questions: number;
    attempts: number;
  };
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(API_ENDPOINTS.ASSESSMENTS.LIST)
      .then(res => {
        setAssessments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch assessments:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          📋 Minhas Avaliações
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie e responda aos seus questionários de estudo.
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Crie avaliações a partir dos seus conteúdos na biblioteca.</p>
            <Link
              href="/dashboard/library"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Ir para Biblioteca
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-x-4 border-b border-gray-900/5 pb-4">
                <div className="h-10 w-10 flex-none rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="font-semibold leading-6 text-gray-900 dark:text-white line-clamp-1">
                  {assessment.content?.title || 'Conteúdo Sem Título'}
                </div>
              </div>
              
              <dl className="-my-3 divide-y divide-gray-100 py-3 text-sm leading-6">
                <div className="flex justify-between gap-x-4 py-3">
                  <dd className="text-gray-700 font-medium">{assessment._count.questions}</dd>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Tentativas</dt>
                  <dd className="text-gray-700 font-medium">{assessment._count.attempts}</dd>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Criado em</dt>
                  <dd className="text-gray-700">
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center gap-x-4">
                <button
                  disabled
                  className="w-full rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ver Resultados
                </button>
                <button
                  disabled
                  className="w-full rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    Iniciar <PlayCircle className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
