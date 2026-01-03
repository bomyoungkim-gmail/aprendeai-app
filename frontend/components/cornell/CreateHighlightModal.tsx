/**
 * Create Highlight Modal
 * 
 * Modal for creating new Cornell highlights.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useCreateHighlight } from '@/hooks/cornell/use-cornell-highlights';
import { cn } from '@/lib/utils';
import { ContentType } from '@/lib/constants/enums';
import { CORNELL_MODAL_LABELS } from '@/lib/cornell/labels';
import { CORNELL_MODAL_CONSTANTS, CORNELL_MODAL_DEFAULTS } from '@/lib/cornell/constants';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config'; // Added import
import { getVisibilityConfig } from '@/lib/cornell/visibility-config';
import type { CornellAnnotationType, ContextTypeKey } from '@/lib/cornell/types';

export interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  targetType: ContentType;
  initialType?: CornellAnnotationType;
  initialPage?: number;
  initialTimestamp?: number;
  initialQuote?: string; // Added quote prop
  contextType?: ContextTypeKey;
  contextId?: string;
}

export function CreateHighlightModal({
  isOpen,
  onClose,
  contentId,
  targetType,
  initialType = CORNELL_MODAL_DEFAULTS.TYPE,
  initialPage = CORNELL_MODAL_DEFAULTS.PAGE,
  initialTimestamp,
  initialQuote = '', 
  contextType = CORNELL_MODAL_DEFAULTS.CONTEXT,
  contextId,
}: CreateHighlightModalProps) {
  const [cornellType, setCornellType] = useState<CornellAnnotationType>(initialType);
  const [comment, setComment] = useState('');
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [timestamp, setTimestamp] = useState<number | undefined>(initialTimestamp);
  
  const visibilityConfig = useMemo(
    () => getVisibilityConfig(contextType, contextId),
    [contextType, contextId]
  );

  const anchoringData = useMemo(
    () => ({
      page_number: targetType === ContentType.PDF ? pageNumber : undefined,
      timestamp_ms: [ContentType.VIDEO, ContentType.AUDIO].includes(targetType) ? timestamp : undefined,
    }),
    [targetType, pageNumber, timestamp]
  );

  const createHighlight = useCreateHighlight(contentId);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      await createHighlight.mutateAsync({
        kind: 'TEXT',
        type: cornellType, // Added missing type
        target_type: targetType,
        anchor_json: {
          type: 'PDF_TEXT',
          position: {
            pageNumber: pageNumber || 1,
            boundingRect: { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },
            rects: []
          },
          quote: initialQuote // Use the passed quote
        } as any, 
        comment_text: comment,
        tags_json: [cornellType],
        ...anchoringData,
        ...visibilityConfig,
      });

      // Reset form
      setComment('');
      setPageNumber(CORNELL_MODAL_CONSTANTS.DEFAULT_PAGE_NUMBER);
      setCornellType(initialType);
      
      onClose();
    } catch (error) {
      console.error('Failed to create highlight:', error);
    }
  };

  if (!isOpen) return null;

  // Pedagogical Types for Selection
  const PEDAGOGICAL_TYPES = ['EVIDENCE', 'VOCABULARY', 'MAIN_IDEA', 'DOUBT'] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Pilar Pedagógico
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Type Selector */}
            <div className="grid grid-cols-4 gap-3">
              {PEDAGOGICAL_TYPES.map((type) => {
                const config = CORNELL_CONFIG[type];
                const Icon = config.icon;
                const isSelected = cornellType === type;
                
                // Explicit color mappings for UI consistency
                const colorMap: Record<string, string> = {
                  yellow: 'text-yellow-400',
                  blue: 'text-blue-400',
                  green: 'text-green-400',
                  red: 'text-red-400',
                };
                const activeBorderMap: Record<string, string> = {
                  yellow: 'border-yellow-500/50 bg-yellow-500/10',
                  blue: 'border-blue-500/50 bg-blue-500/10',
                  green: 'border-green-500/50 bg-green-500/10',
                  red: 'border-red-500/50 bg-red-500/10',
                };

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCornellType(type)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-2",
                      isSelected 
                        ? activeBorderMap[config.color] || 'border-blue-500 bg-blue-500/10'
                        : "border-slate-700 hover:border-slate-600 bg-slate-800"
                    )}
                  >
                    <Icon className={cn("h-6 w-6", colorMap[config.color])} />
                    <span className={cn("text-[10px] font-bold text-center leading-tight", isSelected ? "text-white" : "text-slate-400")}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quote Preview */}
            {initialQuote && (
              <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-slate-600">
                <p className="text-sm text-slate-300 italic line-clamp-3">
                  "{initialQuote}"
                </p>
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={comment}
                  onChange={handleCommentChange}
                  rows={4}
                  placeholder={CORNELL_MODAL_LABELS.PLACEHOLDER[cornellType]}
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={!comment.trim() || createHighlight.isPending}
                  className={cn(
                    'px-6 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2',
                    createHighlight.isPending || !comment.trim()
                      ? 'bg-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                  )}
                >
                  {createHighlight.isPending ? 'SALVANDO...' : '✔ SALVAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
