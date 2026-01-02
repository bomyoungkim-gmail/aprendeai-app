"use client";

import React from 'react';
import { AnalyticsDashboardEnhanced } from '@/components/analytics/AnalyticsDashboardEnhanced';
import { ChevronRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Analytics Dashboard
              </h1>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Data Active
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Visão Geral de Desempenho
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Acompanhe seu progresso, hábitos de estudo e áreas de confusão.
          </p>
        </div>

        <AnalyticsDashboardEnhanced />
      </main>
    </div>
  );
}
