import React from 'react';
import { HelpCircle, Trash2, CheckCircle, MapPin } from 'lucide-react';
import type { QuestionStreamItem } from '@/lib/types/unified-stream';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';

interface QuestionCardProps {
  item: QuestionStreamItem;
  onClick?: () => void;
  onDelete?: () => void;
}

export function QuestionCard({ item, onClick, onDelete }: QuestionCardProps) {
  return (
    <div 
      className={`group relative p-3 rounded-lg border-2 ${
        item.resolved 
          ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
      } hover:shadow-md transition-all cursor-pointer`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className={`h-4 w-4 shrink-0 ${
            item.resolved ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          }`} />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {ITEM_TYPE_LABELS.QUESTION}
          </span>
          {item.section && (
            <span className="text-xs text-gray-500 dark:text-gray-400">• {item.section}</span>
          )}
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete question"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
        {item.question}
      </p>
      
      {item.resolved && item.aiResponseId && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{ITEM_TYPE_LABELS.AI_RESPONSE} respondeu</span>
        </div>
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
