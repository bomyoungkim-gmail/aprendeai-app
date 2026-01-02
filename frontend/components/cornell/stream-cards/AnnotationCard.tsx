import React, { useState } from 'react';
import { Highlighter, Trash2, Edit2, MapPin } from 'lucide-react';
import type { AnnotationStreamItem, UnifiedStreamItem } from '@/lib/types/unified-stream';
import { getColorForKey } from '@/lib/constants/colors';
import { AnnotationEditor } from '../InlineEditor';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';

interface AnnotationCardProps {
  item: AnnotationStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function AnnotationCard({ item, onClick, onEdit, onDelete, onSaveEdit }: AnnotationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const rgb = getColorForKey(item.colorKey);
  
  const handleSaveEdit = (comment: string, colorKey: string) => {
    // Backend expects snake_case field names
    onSaveEdit?.(item, { comment_text: comment, color_key: colorKey });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <AnnotationEditor
          initialComment={item.commentText || ''}
          initialColor={item.colorKey}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  return (
    <div 
      className="group relative p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer"
      style={{ borderColor: rgb }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Highlighter 
            className="h-4 w-4 shrink-0" 
            style={{ color: rgb }}
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {ITEM_TYPE_LABELS.HIGHLIGHT}
          </span>
          {item.pageNumber && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              Pg. {item.pageNumber}
            </span>
          )}
        </div>
        
        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {item.quote && (
        <p 
          className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 px-2 py-1 rounded"
          style={{ backgroundColor: rgb + '20' }}
        >
          "{item.quote}"
        </p>
      )}
      
      {item.commentText && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
          {item.commentText}
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
