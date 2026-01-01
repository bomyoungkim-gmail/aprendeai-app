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
  // Context for automatic visibility determination
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
        target_type: targetType,
        anchor_json: {
          type: 'PDF_TEXT',
          position: {
            pageNumber: pageNumber || 1,
            boundingRect: { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },
            rects: []
          },
          quote: ''
        } as any, // Placeholder - should be provided by selection logic
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
      // Error handling - could show toast notification
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {CORNELL_MODAL_LABELS.TITLE[cornellType]}
            </h3>
            <button
              onClick={onClose}
              aria-label={CORNELL_MODAL_LABELS.BUTTONS.CLOSE_MODAL}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Comment - Large textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {CORNELL_MODAL_LABELS.FIELD[cornellType]}*
              </label>
              <textarea
                value={comment}
                onChange={handleCommentChange}
                rows={CORNELL_MODAL_CONSTANTS.TEXTAREA_ROWS}
                placeholder={CORNELL_MODAL_LABELS.PLACEHOLDER[cornellType]}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-base resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {CORNELL_MODAL_LABELS.BUTTONS.CANCEL}
              </button>
              <button
                type="submit"
                disabled={!comment.trim() || createHighlight.isPending}
                className={cn(
                  'px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors',
                  createHighlight.isPending || !comment.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {createHighlight.isPending ? CORNELL_MODAL_LABELS.BUTTONS.SAVING : CORNELL_MODAL_LABELS.BUTTONS.SAVE}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
