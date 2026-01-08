import React, { useState } from 'react';
import { LearnerGraph } from '@/components/graph/LearnerGraph';

export interface CornellGraphTabProps {
  contentId: string;
  onNavigate?: (page: number, scrollPct?: number) => void;
}

export function CornellGraphTab({ contentId, onNavigate }: CornellGraphTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'h-full'}`}>
      {!isFullscreen && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Grafo de Conhecimento
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visualize seu progresso de aprendizado
          </p>
        </div>
      )}
      <div className="flex-1 relative">
        <LearnerGraph 
          contentId={contentId} 
          onNavigate={onNavigate}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      </div>
    </div>
  );
}
