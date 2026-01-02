import React, { useState } from 'react';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import type { CueItem } from '@/lib/types/cornell';

interface CuesEditorProps {
  cues: CueItem[];
  onChange: (cues: CueItem[]) => void;
  onCueClick?: (cue: CueItem) => void;
}

export function CuesEditor({ cues, onChange, onCueClick }: CuesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddCue = () => {
    const newCue: CueItem = {
      id: `cue-${Date.now()}`,
      prompt: '',
      linkedHighlightIds: [],
    };
    onChange([...cues, newCue]);
    setEditingId(newCue.id);
  };

  const handleUpdateCue = (id: string, prompt: string) => {
    onChange(cues.map((c) => (c.id === id ? { ...c, prompt } : c)));
  };

  const handleDeleteCue = (id: string) => {
    onChange(cues.filter((c) => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cues & Questions</h2>
        <button
          onClick={handleAddCue}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Add cue"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Cues List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {cues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-3">No cues yet</p>
            <button
              onClick={handleAddCue}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add your first cue
            </button>
          </div>
        ) : (
          cues.map((cue, index) => (
            <div
              key={cue.id}
              className="group p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Cue Number + Linked Highlights */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  Cue {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {cue.linkedHighlightIds.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <LinkIcon className="h-3 w-3" />
                      {cue.linkedHighlightIds.length}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteCue(cue.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Delete cue"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Prompt Input */}
              <textarea
                value={cue.prompt}
                onChange={(e) => handleUpdateCue(cue.id, e.target.value)}
                onFocus={() => setEditingId(cue.id)}
                onBlur={() => setEditingId(null)}
                onClick={() => onCueClick?.(cue)}
                placeholder="What question does this answer?"
                className="w-full text-sm text-gray-900 bg-transparent border-none resize-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
                rows={2}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
