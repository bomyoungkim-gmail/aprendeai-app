'use client';

import { Lock, Crown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PremiumFeatureBlockProps {
  featureName: string;
  description: string;
  className?: string;
}

export function PremiumFeatureBlock({ featureName, description, className = '' }: PremiumFeatureBlockProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4 relative">
        <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        <div className="absolute -top-1 -right-1">
          <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {featureName} é um recurso Premium
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        {description}
      </p>
      
      <Link 
        href="/pricing" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
      >
        Ver Planos Premium
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
