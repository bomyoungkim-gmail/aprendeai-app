'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoundNavigatorProps {
  currentRound: number;
  totalRounds: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function RoundNavigator({
  currentRound,
  totalRounds,
  onPrev,
  onNext,
  className = ''
}: RoundNavigatorProps) {
  const isFirstRound = currentRound === 1;
  const isLastRound = currentRound === totalRounds;

  return (
    <div className={`flex items-center justify-center gap-2 md:gap-3 ${className}`}>
      {/* Prev Button */}
      <button
        onClick={onPrev}
        disabled={isFirstRound}
        className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors min-h-[44px]"
        aria-label="Previous Round"
        title="Previous Round (←)"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden md:inline font-medium">Prev</span>
      </button>

      {/* Round Indicator */}
      <div className="text-sm md:text-base font-medium text-gray-700 px-2">
        Round <span className="font-bold text-blue-600">{currentRound}</span>
        <span className="hidden sm:inline"> of </span>
        <span className="sm:hidden text-gray-400">/</span>
        <span className="font-bold">{totalRounds}</span>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isLastRound}
        className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors min-h-[44px]"
        aria-label="Next Round"
        title="Next Round (→)"
      >
        <span className="hidden md:inline font-medium">Next</span>
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
}
