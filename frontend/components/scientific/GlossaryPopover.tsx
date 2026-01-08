"use client";

/**
 * Glossary Popover Component
 * 
 * Displays a popover with the definition of a scientific term
 * Features:
 * - Loading state with skeleton
 * - Definition and source
 * - Close button
 */

import React from 'react';
import { X } from 'lucide-react';
import { GlossaryDefinition } from '@/types/scientific';

interface GlossaryPopoverProps {
  term: string | null;
  definition: GlossaryDefinition | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
}

export function GlossaryPopover({
  term,
  definition,
  isLoading,
  isOpen,
  onClose,
  error,
}: GlossaryPopoverProps) {
  if (!isOpen || !term) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {term}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            data-testid="glossary-popover-close"
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
            </div>
          )}

          {error && !isLoading && (
            <p className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </p>
          )}

          {definition && !isLoading && (
            <>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {definition.definition}
              </p>

              {definition.examples && definition.examples.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Exemplo:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                    {definition.examples[0]}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Fonte:</span> {definition.source}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
