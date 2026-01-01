/**
 * LANGUAGE Mode Layout Component
 * 
 * UI Component - integrates all LANGUAGE mode features
 * Following MelhoresPraticas.txt: components for UI only
 * 
 * Integrates: G6.1, G6.2, G6.3, G6.4
 */

import React from 'react';
import { BookOpen, Star } from 'lucide-react';
import { useWordDefinition } from '@/hooks/language/use-word-definition';
import { useSRSReview } from '@/hooks/language/use-srs-review';
import { WordHighlighter } from '../WordHighlighter';

interface LanguageModeLayoutProps {
  contentId: string;
  children: React.ReactNode;
  onComplete?: () => void;
}

export function LanguageModeLayout({ 
  contentId, 
  children,
  onComplete 
}: LanguageModeLayoutProps) {
  const {
    selectedWord,
    definition,
    srsCount,
    remainingSlots,
    handleWordClick,
    closeDefinition,
    isLoading: isLoadingDefinition
  } = useWordDefinition({ contentId });

  const {
    showReview,
    currentCard,
    currentCardIndex,
    totalCards,
    startReview,
    answerCard,
    skipReview
  } = useSRSReview({ contentId, optIn: true, blockingIfEvaluative: true });

  // G6.3: Show SRS review prompt at end
  if (showReview && currentCard) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Revisão SRS
          </h3>
          <span className="text-sm text-gray-500">
            {currentCardIndex + 1} / {totalCards}
          </span>
        </div>

        <div className="mb-6">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {currentCard.word}
          </p>
          <p className="text-gray-600 dark:text-gray-400 italic">
            "{currentCard.context}"
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {currentCard.definition}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => answerCard(false)}
            className="flex-1 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Não Lembro
          </button>
          <button
            onClick={() => answerCard(true)}
            className="flex-1 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            Lembro
          </button>
        </div>

        <button
          onClick={skipReview}
          className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Pular Revisão
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* SRS Counter */}
      <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-600" />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {srsCount} palavras
          </p>
          <p className="text-xs text-gray-500">
            {remainingSlots} restantes
          </p>
        </div>
      </div>

      {/* G6.4: Highlighted content */}
      <WordHighlighter contentId={contentId}>
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const word = target.getAttribute('data-word');
            if (word) {
              const context = target.textContent || '';
              handleWordClick(word, context);
            }
          }}
        >
          {children}
        </div>
      </WordHighlighter>

      {/* G6.1: Definition Popover */}
      {selectedWord && definition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedWord}
              </h3>
              <button
                onClick={closeDefinition}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {isLoadingDefinition ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {definition.definitions.map((def, index) => (
                    <p key={index} className="text-gray-700 dark:text-gray-300">
                      {index + 1}. {def}
                    </p>
                  ))}
                </div>

                {definition.examples && definition.examples.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Exemplos:
                    </p>
                    {definition.examples.map((example, index) => (
                      <p key={index} className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{example}"
                      </p>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  Fonte: {definition.source}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
