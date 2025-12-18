import React from 'react';
import { Eye, BookOpen } from 'lucide-react';
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
          title={mode === 'original' ? 'Switch to Study Mode' : 'Switch to Original View'}
        >
          {mode === 'original' ? (
            <>
              <BookOpen className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Study Mode</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Original View</span>
            </>
          )}
        </button>

        {/* Save Status */}
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
      </div>
    </div>
  );
}
