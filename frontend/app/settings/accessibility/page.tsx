"use client";

import React from 'react';
import { AccessibilityControls } from '@/components/accessibility/AccessibilityControls';
import { useAccessibility } from '@/hooks/accessibility/use-accessibility';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AccessibilitySettingsPage() {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Acessibilidade
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Preferências Visuais
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Personalize sua experiência de leitura conforme suas necessidades.
            </p>
          </div>

          <AccessibilityControls 
            settings={settings} 
            onChange={updateSettings} 
            onReset={resetSettings} 
          />
        </section>

        <section className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
          <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2">
            💡 Dica de Produtividade
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Você pode usar os atalhos de teclado <strong>Ctrl +</strong> para aumentar a fonte e <strong>Ctrl -</strong> para diminuir em qualquer página de leitura.
          </p>
        </section>
      </main>
    </div>
  );
}
