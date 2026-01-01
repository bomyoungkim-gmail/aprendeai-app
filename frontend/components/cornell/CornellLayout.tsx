import React from 'react';
import { TopBar } from './TopBar';
import { CuesEditor } from './CuesEditor';
import { NotesEditor } from './NotesEditor';
import { SummaryEditor } from './SummaryEditor';
import type { ViewMode, SaveStatus, CueItem, NoteItem } from '@/lib/types/cornell';

interface CornellLayoutProps {
  // Top Bar
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;

  // Cornell Notes
  cues: CueItem[];
  onCuesChange: (cues: CueItem[]) => void;
  notes: NoteItem[];
  onNotesChange: (notes: NoteItem[]) => void;
  summary: string;
  onSummaryChange: (summary: string) => void;

  // Viewer
  viewer: React.ReactNode;

  // Optional callbacks
  // Optional callbacks
  onCueClick?: (cue: CueItem) => void;
  onNoteClick?: (note: NoteItem) => void;
  onLayoutChange?: () => void;
}

export function CornellLayout({
  title,
  mode,
  onModeToggle,
  saveStatus,
  lastSaved,
  cues,
  onCuesChange,
  notes,
  onNotesChange,
  summary,
  onSummaryChange,
  viewer,
  onCueClick,
  onNoteClick,
  onLayoutChange,
}: CornellLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50" data-testid="cornell-layout">
      {/* Top Bar */}
      <TopBar
        title={title}
        mode={mode}
        onModeToggle={onModeToggle}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onLayoutChange={onLayoutChange}
      />

      {/* Main Content: 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Cues */}
        <div className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <CuesEditor cues={cues} onChange={onCuesChange} onCueClick={onCueClick} />
        </div>

        {/* Center Column: Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {viewer}
        </div>

        {/* Right Column: Notes */}
        <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <NotesEditor notes={notes} onChange={onNotesChange} onNoteClick={onNoteClick} />
        </div>
      </div>

      {/* Bottom: Summary */}
      <div className="h-48 border-t border-gray-200 bg-white p-4">
        <SummaryEditor summary={summary} onChange={onSummaryChange} />
      </div>
    </div>
  );
}
