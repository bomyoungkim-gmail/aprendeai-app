import React, { useState } from 'react';
import { FileText, Trash2, Edit2 } from 'lucide-react';
import type { NoteStreamItem, UnifiedStreamItem } from '@/lib/types/unified-stream';
import { NoteEditor } from '../InlineEditor';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';

interface NoteCardProps {
  item: NoteStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function NoteCard({ item, onClick, onEdit, onDelete, onSaveEdit }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSaveEdit = (body: string) => {
    onSaveEdit?.(item, { body });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <NoteEditor
          initialBody={item.body}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  return (
    <div 
      className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{ITEM_TYPE_LABELS.NOTE}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit note"
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
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.body}
      </p>
      
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
