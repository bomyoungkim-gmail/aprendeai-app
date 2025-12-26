'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface ReadingSession {
  id: string;
  phase: 'PRE' | 'DURING' | 'POST' | 'FINISHED';
  startedAt: string;
  finishedAt?: string;
}

interface SessionRibbonProps {
  session: ReadingSession;
  onAdvancePhase: (toPhase: 'POST' | 'FINISHED') => Promise<void>;
}

export function SessionRibbon({ session, onAdvancePhase }: SessionRibbonProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);

  const getPhaseColor = (phase: string, current: string) => {
    if (phase === current) return 'bg-blue-600 text-white';
    
    const phases = ['PRE', 'DURING', 'POST', 'FINISHED'];
    const phaseIndex = phases.indexOf(phase);
    const currentIndex = phases.indexOf(current);
    
    if (phaseIndex < currentIndex) return 'bg-green-600 text-white';
    return 'bg-gray-300 text-gray-600';
  };

  const getTimeSpent = () => {
    const start = new Date(session.startedAt);
    const end = session.finishedAt ? new Date(session.finishedAt) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    return diff;
  };

  const handleAdvance = async () => {
    if (isAdvancing) return;
    
    try {
      setIsAdvancing(true);
      
      if (session.phase === 'DURING') {
        await onAdvancePhase('POST');
      } else if (session.phase === 'POST') {
        await onAdvancePhase('FINISHED');
      }
      } catch (error) {
        logger.error('Failed to advance phase', error);
      alert(error instanceof Error ? error.message : 'Failed to advance phase');
    } finally {
      setIsAdvancing(false);
    }
  };

  const showAdvanceButton = session.phase === 'DURING' || session.phase === 'POST';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Phase Indicators */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Session:</span>
            
            {['PRE', 'DURING', 'POST', 'FINISHED'].map((phase, index) => (
              <div key={phase} className="flex items-center">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${getPhaseColor(
                    phase,
                    session.phase
                  )}`}
                >
                  {phase}
                </div>
                {index < 3 && (
                  <svg
                    className="h-4 w-4 mx-1 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center space-x-6">
            {/* Time Spent */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">{getTimeSpent()}m</span>
            </div>

            {/* Advance Button */}
            {showAdvanceButton && (
              <button
                onClick={handleAdvance}
                disabled={isAdvancing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAdvancing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {session.phase === 'DURING' ? 'Finish Reading' : 'Finish Session'}
                    <svg
                      className="ml-2 -mr-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}

            {/* Finished Badge */}
            {session.phase === 'FINISHED' && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold">Complete!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
