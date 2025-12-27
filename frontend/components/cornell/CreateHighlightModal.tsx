/**
 * Create Highlight Modal
 * 
 * Modal for creating new Cornell highlights.
 */

'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateHighlight } from '@/hooks/cornell/use-cornell-highlights';
import { useVisibilityState } from '@/hooks/cornell/use-visibility';
import { CornellTypeSelector } from './CornellTypeSelector';
import { VisibilityControls } from './VisibilityControls';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/lib/constants/enums';

export interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  targetType: TargetType;
}

export function CreateHighlightModal({
  isOpen,
  onClose,
  contentId,
  targetType,
}: CreateHighlightModalProps) {
  const [cornellType, setCornellType] = useState<'NOTE' | 'QUESTION' | 'STAR' | 'HIGHLIGHT'>('NOTE');
  const [comment, setComment] = useState('');
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  const visibilityState = useVisibilityState();
  const createHighlight = useCreateHighlight(contentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      await createHighlight.mutateAsync({
        type: cornellType,
        target_type: targetType,
        page_number: targetType === 'PDF' ? pageNumber : undefined,
        comment_text: comment,
        ...visibilityState.config,
      });

      // Reset form
      setComment('');
      setPageNumber(1);
      setCornellType('NOTE');
      
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Nova Anotação Cornell
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Cornell Type */}
            <CornellTypeSelector
              value={cornellType}
              onChange={setCornellType}
            />

            {/* Page Number (PDF only) */}
            {targetType === 'PDF' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Página
                </label>
                <input
                  type="number"
                  min="1"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anotação*
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Digite sua anotação..."
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Visibility */}
            <VisibilityControls
              config={visibilityState.config}
              onChange={(partial) => {
                Object.entries(partial).forEach(([key, value]) => {
                  const setter = visibilityState[`set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof visibilityState];
                  if (typeof setter === 'function') {
                    (setter as Function)(value);
                  }
                });
              }}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!comment.trim() || createHighlight.isPending || !visibilityState.isValid}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-md',
                  createHighlight.isPending || !comment.trim() || !visibilityState.isValid
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {createHighlight.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
