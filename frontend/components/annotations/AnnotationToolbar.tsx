'use client';

import { Highlighter, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';

interface AnnotationToolbarProps {
  selection: {
    text: string;
    startOffset: number;
    endOffset: number;
    x: number;
    y: number;
  } | null;
  onCreateAnnotation: (type: 'HIGHLIGHT' | 'NOTE', color?: string, text?: string) => void;
  onClose: () => void;
}

export function AnnotationToolbar({ selection, onCreateAnnotation, onClose }: AnnotationToolbarProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  if (!selection) return null;

  const handleCreateHighlight = (color: string) => {
    onCreateAnnotation('HIGHLIGHT', color);
    onClose();
  };

  const handleCreateNote = () => {
    if (noteText.trim()) {
      onCreateAnnotation('NOTE', undefined, noteText);
      setNoteText('');
      setShowNoteInput(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed bg-white shadow-lg rounded-lg border border-gray-200 p-2 z-50"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {!showNoteInput ? (
        <div className="flex items-center gap-1">
          {/* Highlight Colors */}
          <button
            onClick={() => handleCreateHighlight('yellow')}
            className="p-2 hover:bg-yellow-100 rounded transition-colors"
            title="Yellow highlight"
          >
            <Highlighter className="w-4 h-4 text-yellow-600" />
          </button>
          <button
            onClick={() => handleCreateHighlight('green')}
            className="p-2 hover:bg-green-100 rounded transition-colors"
            title="Green highlight"
          >
            <Highlighter className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => handleCreateHighlight('blue')}
            className="p-2 hover:bg-blue-100 rounded transition-colors"
            title="Blue highlight"
          >
            <Highlighter className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleCreateHighlight('pink')}
            className="p-2 hover:bg-pink-100 rounded transition-colors"
            title="Pink highlight"
          >
            <Highlighter className="w-4 h-4 text-pink-600" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Add Note */}
          <button
            onClick={() => setShowNoteInput(true)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Add note"
          >
            <MessageSquare className="w-4 h-4 text-gray-700" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="w-64">
          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your note..."
            className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowNoteInput(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNote}
              disabled={!noteText.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
