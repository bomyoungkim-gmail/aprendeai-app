import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import type { AISuggestionStreamItem } from '@/lib/types/unified-stream';

interface AISuggestionCardProps {
  item: AISuggestionStreamItem;
  onClick?: () => void;
  onDelete?: () => void;
}

export function AISuggestionCard({ item, onClick, onDelete }: AISuggestionCardProps) {
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            IA Sugestão
          </span>
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dismiss"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.content}
      </p>
      
      {!item.accepted && (
        <div className="mt-3 flex gap-2">
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition">
            Aceitar
          </button>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition">
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}
