import React from 'react';
import { Star, Trash2, MapPin } from 'lucide-react';
import type { ImportantStreamItem } from '@/lib/types/unified-stream';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';

interface ImportantCardProps {
  item: ImportantStreamItem;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ImportantCard({ item, onClick, onDelete }: ImportantCardProps) {
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {ITEM_TYPE_LABELS.IMPORTANT}
          </span>
          {item.pageNumber && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              Pg. {item.pageNumber}
            </span>
          )}
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 px-2 py-1 rounded bg-yellow-100/50 dark:bg-yellow-900/20">
        "{item.quote}"
      </p>
      
      {item.note && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
          {item.note}
        </p>
      )}
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}
