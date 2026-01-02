import React from 'react';
import Link from 'next/link';
import { Eye, BookOpen, Brain, ArrowLeft } from 'lucide-react';
import { SaveStatusIndicator } from '../SaveStatusIndicator';
import type { ViewMode, SaveStatus } from '@/lib/types/cornell';

interface TopBarProps {
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  onLayoutChange?: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;
}

/**
 * @deprecated Part of the classic layout. Use ModernCornellLayout components instead.
 */
export function TopBar({
  title,
  mode,
  onModeToggle,
  onLayoutChange,
  saveStatus,
  lastSaved,
}: TopBarProps) {
  // Get next mode for display
  const getNextModeLabel = () => {
    if (mode === 'original') return 'Study Mode';
    if (mode === 'study') return 'Review Mode';
    return 'Original View';
  };

  const getCurrentModeIcon = () => {
    if (mode === 'original') return <Eye className="h-4 w-4 text-gray-600" />;
    if (mode === 'study') return <BookOpen className="h-4 w-4 text-gray-600" />;
    return <Brain className="h-4 w-4 text-purple-600" />;
  };

  const getCurrentModeLabel = () => {
    if (mode === 'original') return 'Original';
    if (mode === 'study') return 'Study';
    return 'Review';
  };

  return (
    <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-6 w-px bg-gray-200"></div>
        <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
          {title || 'Untitled Document'}
        </h1>
      </div>

      {/* Right side: Mode Toggle + Save Status */}
      <div className="flex items-center gap-6">
        {/* Layout Switch */}
        {onLayoutChange && (
          <button
            onClick={onLayoutChange}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span>✨ Moderno</span>
          </button>
        )}

        {/* Mode Toggle */}
        <button
          onClick={onModeToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title={`Current: ${getCurrentModeLabel()} • Click for ${getNextModeLabel()}`}
        >
          {getCurrentModeIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getCurrentModeLabel()} → {getNextModeLabel()}
          </span>
        </button>

        {/* Save Status */}
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
      </div>
    </div>
  );
}

