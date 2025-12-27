/**
 * Cornell Notes Panel
 * 
 * Main component for Cornell Notes functionality.
 * Integrates highlight creation, listing, and management.
 */

'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useGetHighlights } from '@/hooks/cornell/use-cornell-highlights';
import { useOfflineSync } from '@/hooks/cornell/use-offline-sync';
import { CornellHighlightList } from './CornellHighlightList';
import { CreateHighlightModal } from './CreateHighlightModal';
import { cn } from '@/lib/utils';

export interface CornellPanelProps {
  contentId: string;
  targetType: 'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  className?: string;
  onHighlightSelect?: (highlightId: string) => void;
}

export function CornellPanel({
  contentId,
  targetType,
  className,
  onHighlightSelect,
}: CornellPanelProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Fetch highlights
  const { data: highlights, isLoading, error } = useGetHighlights(contentId);
  
  // Offline sync status
  const { isOnline, queueLength } = useOfflineSync();

  return (
    <div className={cn('flex flex-col h-full bg-white border-l border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cornell Notes</h2>
          <p className="text-sm text-gray-500">
            {highlights?.length || 0} anotações
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Nova Nota
        </button>
      </div>

      {/* Offline Status */}
      {!isOnline && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <div className="h-2 w-2 bg-yellow-600 rounded-full animate-pulse" />
            Offline {queueLength > 0 && `- ${queueLength} pendente(s)`}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Erro ao carregar anotações
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && highlights && (
          <CornellHighlightList
            highlights={highlights}
            contentId={contentId}
            onHighlightSelect={onHighlightSelect}
          />
        )}

        {!isLoading && !error && highlights?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="max-w-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma anotação ainda
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Crie sua primeira anotação Cornell para começar a organizar seu
                estudo de forma eficaz.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Nota
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateHighlightModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        contentId={contentId}
        targetType={targetType}
      />
    </div>
  );
}
