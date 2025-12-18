'use client';

import { useReview } from '@/hooks/useReview';
import { VocabCard } from './VocabCard';

export function ReviewMode() {
  const {
    queue,
    isLoading,
    error,
    currentItem,
    submitAttempt,
    progress,
    isSubmitting,
  } = useReview();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your review queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {error instanceof Error ? error.message : 'Failed to load review queue'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queue || queue.vocab.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            All Done!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            You've completed all reviews for today. Great job!
          </p>
          <div className="bg-blue-50 rounded-xl p-6">
            <p className="text-sm text-blue-900 font-medium">
              Daily Cap: {queue?.stats.cap || 20} items
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Come back tomorrow for more reviews
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      {/* Header Stats */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Progress */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {progress?.current}
                </div>
                <div className="text-xs text-gray-500">of {progress?.total}</div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {progress?.percentage}% complete
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900">{queue.stats.totalDue}</div>
                <div className="text-gray-500">Total Due</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">{queue.stats.cap}</div>
                <div className="text-gray-500">Daily Cap</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vocab Card */}
      <VocabCard
        vocab={currentItem}
        onAttempt={(result) => submitAttempt(currentItem.id, result)}
        isSubmitting={isSubmitting}
      />

      {/* Keyboard Shortcuts Hint */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
          <p className="text-xs text-gray-600">
            💡 Tip: Focus on <strong>recalling</strong> before revealing the answer
          </p>
        </div>
      </div>
    </div>
  );
}
