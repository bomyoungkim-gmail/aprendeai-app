import React, { useState } from 'react';
import { Trash2, Edit2, MapPin, Clock } from 'lucide-react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { getColorForKey } from '@/lib/constants/colors';
import { AnnotationEditor } from '../InlineEditor';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';

interface AnnotationCardProps {
  item: UnifiedStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function AnnotationCard({ item, onClick, onEdit, onDelete, onSaveEdit }: AnnotationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Get config based on item type
  const typeKey = ((item as any).annotationType || item.type?.toUpperCase() || 'EVIDENCE').replace(/-/g, '_');
  const config = CORNELL_CONFIG[typeKey] || CORNELL_CONFIG.EVIDENCE;
  const Icon = config.icon;
  
  // Color handling - Pillars (Vocab, Idea, Doubt) strictly use config color.
  // Evidence (Highlight) uses the highlight's specific color.
  const colorKey = config.forceColor ? config.color : ((item as any).colorKey || config.color);
  const rgb = getColorForKey(colorKey);
  
  // Content extraction (normalize different item structures)
  const quote = (item as any).quote || (item as any).highlight?.anchorJson?.quote || (item as any).highlight?.anchor_json?.quote;
  const comment = (item as any).commentText || (item as any).comment_text || (item as any).highlight?.comment_text || (item as any).highlight?.comment?.message || (item as any).question || (item as any).note || (item as any).note?.body;

  const handleSaveEdit = (newComment: string, newColorKey: string, newType?: string) => {
    // Determine the tags_json based on the new type
    let tagsJson = (item as any).tagsJson || [];
    if (newType) {
      const targetConfig = CORNELL_CONFIG[newType.toUpperCase()];
      if (targetConfig) {
        tagsJson = targetConfig.tags;
      }
    }

    onSaveEdit?.(item, { 
      comment_text: newComment, 
      color_key: newColorKey,
      tags_json: tagsJson,
      type: newType?.toUpperCase() 
    });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="p-1">
        <AnnotationEditor
          initialComment={comment || ''}
          initialColor={colorKey}
          initialType={typeKey}
          quote={typeof quote === 'string' ? quote : undefined}
          pageNumber={
            (item as any).pageNumber || 
            (item as any).highlight?.pageNumber ||
            (item as any).highlight?.page_number ||
            (item as any).highlight?.anchorJson?.position?.pageNumber ||
            (item as any).highlight?.anchor_json?.position?.pageNumber ||
            (item as any).highlight?.anchor_json?.page_number
          } // Robust pageNumber extraction
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  return (
    <div 
      data-testid="annotation-card"
      className="group relative p-3 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-800/50"
      style={{ borderColor: rgb }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon 
            className="h-4 w-4 shrink-0" 
            style={{ color: rgb }}
          />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: rgb }}>
            {config.label}
          </span>
          {(item as any).timestampMs && !isNaN(Number((item as any).timestampMs)) && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {new Date((item as any).timestampMs).toISOString().substr(11, 8)}
            </span>
          )}
        </div>
        
        {/* Actions (visible on hover) */}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Editar"
            >
              <Edit2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            </button>
          </div>

          {/* Page Number - Moved here */}
          {((item as any).pageNumber || (item as any).highlight?.pageNumber || (item as any).highlight?.page_number) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
              <MapPin className="h-3 w-3" />
              Pg. {(item as any).pageNumber || (item as any).highlight?.pageNumber || (item as any).highlight?.page_number}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-2">
        {quote && typeof quote === 'string' && (
          <p 
            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 px-2 py-1.5 rounded border-l-2 italic"
            style={{ 
              backgroundColor: rgb + '10',
              borderColor: rgb
            }}
          >
            "{quote}"
          </p>
        )}
        
        {comment && typeof comment === 'string' && (
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
            {comment}
          </p>
        )}
      </div>
      
      {/* Footer / Meta */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
        <span>
          {(() => {
            try {
              const dateSrc = item.createdAt || (item as any).created_at || (item as any).highlight?.createdAt || (item as any).timestampMs || (item as any).highlight?.timestampMs;
              if (!dateSrc) return 'Sem data';
              const date = new Date(dateSrc);
              if (isNaN(date.getTime())) return 'Data inválida';
              return date.toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            } catch (e) {
              return 'Data inválida';
            }
          })()}
        </span>
        <span>ID: {item.id ? item.id.slice(0, 8) : 'N/A'}</span>
      </div>
    </div>
  );
}
