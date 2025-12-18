import React from 'react';
import { Eye, BookOpen, Brain } from 'lucide-react';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { ViewMode, SaveStatus } from '@/lib/types/cornell';

interface TopBarProps {
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;
}

export function TopBar({
  title,
  mode,
  onModeToggle,
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
      {/* Title */}
      <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
        {title || 'Untitled Document'}
      </h1>

      {/* Right side: Mode Toggle + Save Status */}
      <div className="flex items-center gap-6">
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

