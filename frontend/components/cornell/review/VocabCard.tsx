'use client';

import { useState } from 'react';
import { Transition } from '@headlessui/react';

interface VocabItem {
  id: string;
  word: string;
  srsStage: string;
  lapsesCount: number;
  meaningNote?: string;
  exampleNote?: string;
  content?: {
    title: string;
  };
}

interface VocabCardProps {
  vocab: VocabItem;
  onAttempt: (result: 'FAIL' | 'HARD' | 'OK' | 'EASY') => void;
  isSubmitting?: boolean;
}

export function VocabCard({ vocab, onAttempt, isSubmitting }: VocabCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleAttempt = (result: 'FAIL' | 'HARD' | 'OK' | 'EASY') => {
    onAttempt(result);
    setIsRevealed(false); // Reset for next card
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card Container */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium opacity-90">SRS Stage</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                {vocab.srsStage}
              </span>
            </div>
            {vocab.lapsesCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-90">Lapses:</span>
                <span className="px-2 py-1 bg-red-500/30 rounded text-sm font-bold">
                  {vocab.lapsesCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="px-8 py-12">
          {/* Word */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold text-gray-900 mb-2">{vocab.word}</h2>
            {vocab.content && (
              <p className="text-sm text-gray-500">
                From: <span className="font-medium">{vocab.content.title}</span>
              </p>
            )}
          </div>

          {!isRevealed ? (
            /* Front - Recall Prompt */
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-8">
                What does this word mean?
              </p>
              <button
                onClick={() => setIsRevealed(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-colors"
              >
                Reveal Meaning
              </button>
            </div>
          ) : (
            /* Back - Meaning + Response */
            <Transition
              show={isRevealed}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
            >
              <div className="space-y-6">
                {/* Meaning */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    MEANING
                  </h3>
                  <p className="text-lg text-gray-800">
                    {vocab.meaningNote || 'No definition provided yet'}
                  </p>
                </div>

                {/* Example */}
                {vocab.exampleNote && (
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2">
                      EXAMPLE
                    </h3>
                    <p className="text-gray-700 italic">"{vocab.exampleNote}"</p>
                  </div>
                )}

                {/* Response Buttons */}
                <div className="pt-6">
                  <p className="text-sm text-gray-600 text-center mb-4">
                    How well did you recall this word?
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      onClick={() => handleAttempt('FAIL')}
                      disabled={isSubmitting}
                      className="py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl mb-1">😞</div>
                      <div className="text-sm">Fail</div>
                    </button>

                    <button
                      onClick={() => handleAttempt('HARD')}
                      disabled={isSubmitting}
                      className="py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl mb-1">😐</div>
                      <div className="text-sm">Hard</div>
                    </button>

                    <button
                      onClick={() => handleAttempt('OK')}
                      disabled={isSubmitting}
                      className="py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl mb-1">🙂</div>
                      <div className="text-sm">OK</div>
                    </button>

                    <button
                      onClick={() => handleAttempt('EASY')}
                      disabled={isSubmitting}
                      className="py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl mb-1">😄</div>
                      <div className="text-sm">Easy</div>
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {!isRevealed ? (
            <>Try to recall the meaning before revealing</>
          ) : (
            <>Choose how well you remembered this word</>
          )}
        </p>
      </div>
    </div>
  );
}
