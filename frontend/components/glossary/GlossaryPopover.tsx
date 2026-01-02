/**
 * Glossary Popover Component
 * 
 * Following MelhoresPraticas.txt:
 * - UI component apenas
 * - Props para dados e callbacks
 * - Sem lógica de negócio
 * 
 * G5.3: Displays scientific term definitions
 */

import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';

export interface Definition {
  term: string;
  definition: string;
  source: 'PubMed' | 'Wikipedia' | 'Wiktionary';
  examples?: string[];
}

interface GlossaryPopoverProps {
  term: string;
  definition: Definition | null;
  isLoading: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function GlossaryPopover({
  term,
  definition,
  isLoading,
  onClose,
  position
}: GlossaryPopoverProps) {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-8px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {term}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        )}

        {!isLoading && definition && (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {definition.definition}
            </p>

            {definition.examples && definition.examples.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Exemplos:
                </p>
                <ul className="space-y-1">
                  {definition.examples.map((example, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-400 italic"
                    >
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Fonte: {definition.source}
              </span>
              {definition.source === 'Wikipedia' && (
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver mais
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </>
        )}

        {!isLoading && !definition && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Definição não encontrada
          </p>
        )}
      </div>
    </div>
  );
}
