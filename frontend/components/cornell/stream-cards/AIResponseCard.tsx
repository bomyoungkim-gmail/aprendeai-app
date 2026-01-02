import React from 'react';
import { MessageSquare, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { AIResponseStreamItem } from '@/lib/types/unified-stream';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';

interface AIResponseCardProps {
  item: AIResponseStreamItem;
  onClick?: () => void;
  onDelete?: () => void;
}

export function AIResponseCard({ item, onClick, onDelete }: AIResponseCardProps) {
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {ITEM_TYPE_LABELS.AI_RESPONSE}
          </span>
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.response}
      </p>
      
      {/* Feedback */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">Útil?</span>
        <button 
          className={`p-1 rounded transition ${
            item.helpful === true ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
          }`}
          title="Helpful"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button 
          className={`p-1 rounded transition ${
            item.helpful === false ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
          }`}
          title="Not helpful"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
      
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
