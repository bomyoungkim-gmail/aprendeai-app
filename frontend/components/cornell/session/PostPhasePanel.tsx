'use client';

import { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';

interface PostPhasePanelProps {
  isOpen: boolean;
  sessionId: string;
  hasSummary: boolean;
  onRecordProduction: (text: string, wordCount: number) => Promise<void>;
  onClose?: () => void;
}

export function PostPhasePanel({
  isOpen,
  sessionId,
  hasSummary,
  onRecordProduction,
  onClose,
}: PostPhasePanelProps) {
  const [productionText, setProductionText] = useState('');
  const [hasQuiz, setHasQuiz] = useState(false); // TODO: Track from events
  const [hasProduction, setHasProduction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = productionText.trim().split(/\s+/).filter(Boolean).length;
  const isProductionValid = wordCount >= 50;

  const canFinish = hasSummary && hasQuiz && hasProduction;

  const handleSubmitProduction = async () => {
    if (!isProductionValid) {
      alert('Please write at least 50 words');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordProduction(productionText.trim(), wordCount);
      setHasProduction(true);
      alert('Production text saved! ✅');
    } catch (error) {
      console.error('Failed to submit production:', error);
      alert('Failed to save production text');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition
      show={isOpen}
      enter="transition-transform duration-300"
      enterFrom="translate-x-full"
      enterTo="translate-x-0"
      leave="transition-transform duration-300"
      leaveFrom="translate-x-0"
      leaveTo="translate-x-full"
    >
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Your Session
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Definition of Done Checklist */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Definition of Done
            </h3>
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded ${
                    hasSummary ? 'bg-green-500' : 'bg-gray-300'
                  } flex items-center justify-center`}
                >
                  {hasSummary && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cornell Notes Summary
                  </p>
                  <p className="text-xs text-gray-500">
                    {hasSummary
                      ? 'Summary completed ✓'
                      : 'Write a summary in Cornell Notes'}
                  </p>
                </div>
              </div>

              {/* Quiz */}
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded ${
                    hasQuiz ? 'bg-green-500' : 'bg-yellow-400'
                  } flex items-center justify-center`}
                >
                  {hasQuiz && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Quiz Answer
                  </p>
                  <p className="text-xs text-gray-500">
                    {hasQuiz ? 'Completed ✓' : 'Answer at least 1 question'}
                  </p>
                </div>
              </div>

              {/* Production */}
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded ${
                    hasProduction ? 'bg-green-500' : 'bg-yellow-400'
                  } flex items-center justify-center`}
                >
                  {hasProduction && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Production Text
                  </p>
                  <p className="text-xs text-gray-500">
                    {hasProduction
                      ? 'Submitted ✓'
                      : 'Write your understanding below'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Textarea */}
          <div className="mb-6">
            <label
              htmlFor="production"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Write in Your Own Words
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Explain what you learned or understood from this reading. This helps consolidate your knowledge.
            </p>
            <textarea
              id="production"
              rows={8}
              value={productionText}
              onChange={(e) => setProductionText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 resize-none"
              placeholder="In my own words, I learned that..."
              disabled={hasProduction}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className={`text-xs ${isProductionValid ? 'text-green-600' : 'text-gray-500'}`}>
                {wordCount} / 50 words minimum
                {isProductionValid && ' ✓'}
              </p>
              {!hasProduction && (
                <button
                  onClick={handleSubmitProduction}
                  disabled={!isProductionValid || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Production'}
                </button>
              )}
            </div>
          </div>

          {/* Completion Status */}
          {canFinish ? (
            <div className="rounded-lg bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Ready to finish!
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    You've completed all requirements. Click "Finish Session" in the ribbon above.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Complete remaining tasks
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Finish all checklist items above before ending the session.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Transition>
  );
}
