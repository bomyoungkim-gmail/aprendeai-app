import React, { useState } from 'react';
import { FileCheck, Trash2, Edit2, MapPin, Clock, Hash, ExternalLink, Tag } from 'lucide-react';
import type { SynthesisStreamItem, NoteStreamItem, UnifiedStreamItem, SynthesisAnchor, SynthesisCategory } from '@/lib/types/unified-stream';
import { NoteEditor } from '../InlineEditor';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';
import { SYNTHESIS_CATEGORY_LABELS } from '@/lib/cornell/synthesis-logic';
import type { Section } from '@/lib/content/section-detector';

interface NoteCardProps {
  item: NoteStreamItem | SynthesisStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
  currentPage?: number;
  sections?: Section[];
}

export function NoteCard({ item, onClick, onEdit, onDelete, onSaveEdit, currentPage, sections }: NoteCardProps) {
  // Extract body for empty check
  const body = (item as any).body || (item as any).commentText || (item as any).note?.body || '';
  
  const [isEditing, setIsEditing] = useState(!body); // Auto-edit if empty
  
  const [isExpanded, setIsExpanded] = useState(false);

  const config = CORNELL_CONFIG.SYNTHESIS;
  
  // Calculate default location based on context
  const defaultLocationLabel = React.useMemo(() => {
    if (!currentPage) return '';
    return `Pág ${currentPage}`;
  }, [currentPage]);

  // Merge default location if missing
  // Refactor: We pass defaultLocationLabel explicitly to NoteEditor for new items
  // so it can handle placeholder/fallback without pre-filling the input.
  const anchor = (item as SynthesisStreamItem).anchor || (item as any).note?.anchor || {};

  const isTransversal = !!anchor?.transversal;

  const handleSaveEdit = (newBody: string, newAnchor?: SynthesisAnchor) => {
    // If no anchor changes, we just save the body.
    // Ideally we merge? But the editor sends the FULL anchor state.
    const updates: any = { body: newBody, comment_text: newBody };
    if (newAnchor) {
      updates.anchor = newAnchor;
    }
    
    onSaveEdit?.(item, updates);
    setIsEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  if (isEditing) {
    return (
      <div className="relative p-3 rounded-lg border border-purple-200 dark:border-purple-900/30">
        <NoteEditor
          initialBody={body}
          initialAnchor={anchor}
          onSave={handleSaveEdit}
          onCancel={() => {
            if (!body.trim()) {
              onDelete?.();
            } else {
              setIsEditing(false);
            }
          }}
          sections={sections}
          defaultLocationLabel={defaultLocationLabel}
        />
      </div>
    );
  }

  const isLong = body.length > 300;
  const displayBody = isLong && !isExpanded ? body.slice(0, 300) + '...' : body;

  return (
    <div 
      className={`
        group relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md
        ${isTransversal 
          ? 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-900/10' 
          : 'border-purple-200 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10'}
      `}
      onClick={onClick}
    >
      {/* 1. Header: Type + Transversal + Actions */}
      <div className="flex items-start justify-between mb-2 gap-2 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Label (SÍNTESE) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-current opacity-80 hover:opacity-100 hover:scale-105 transition-all"
          >
            <FileCheck className={`h-3 w-3 ${isTransversal ? 'text-indigo-600' : 'text-purple-600'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-tight ${isTransversal ? 'text-indigo-700' : 'text-purple-700'}`}>
              {config.label}
            </span>
          </button>

          {/* Transversal Pillar */}
          {anchor?.transversal?.category && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Hash className="h-3 w-3" />
              <span className="text-[10px] font-bold">
                {SYNTHESIS_CATEGORY_LABELS[anchor.transversal.category as SynthesisCategory] || anchor.transversal.category}
              </span>
            </button>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
            title="Editar síntese"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* 2. Location Row */}
      {anchor?.location?.label && (
        <div className="mb-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:ring-1 hover:ring-blue-300 transition-all w-fit max-w-full"
            >
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">
                {anchor.location.label}
              </span>
            </button>
        </div>
      )}

      {/* 3. Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
          {displayBody}
        </p>
        
        {isLong && !isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Ver mais
          </button>
        )}
        {isLong && isExpanded && (
           <button 
           onClick={(e) => {
             e.stopPropagation();
             setIsExpanded(!isExpanded);
           }}
           className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
         >
           Ver menos
         </button>
        )}
      </div>
      
      {/* 4. Footer: Temporal + Created At */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/50 pt-2 relative z-0">
        <div className="flex items-center gap-3">
          {/* Temporal / Timestamp */}
          {anchor?.temporal?.label && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"
            >
              <Clock className="h-3 w-3" />
              {anchor.temporal.label}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
           {/* Creation Date - Right Aligned */}
           <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
             Criado em {new Date(item.createdAt || Date.now()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
           </span>

           {/* External Link / Share Icon */}
           <button 
              onClick={(e) => {
                e.stopPropagation();
                // Placeholder for open/share action
              }}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Abrir/Visualizar"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
        </div>
      </div>
    </div>
  );
}
