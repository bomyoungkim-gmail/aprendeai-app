import React, { useState } from 'react';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import type { NoteItem } from '@/lib/types/cornell';

interface NotesEditorProps {
  notes: NoteItem[];
  onChange: (notes: NoteItem[]) => void;
  onNoteClick?: (note: NoteItem) => void;
}

export function NotesEditor({ notes, onChange, onNoteClick }: NotesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddNote = () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      body: '',
      linkedHighlightIds: [],
    };
    onChange([...notes, newNote]);
    setEditingId(newNote.id);
  };

  const handleUpdateNote = (id: string, body: string) => {
    onChange(notes.map((n) => (n.id === id ? { ...n, body } : n)));
  };

  const handleDeleteNote = (id: string) => {
    onChange(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <button
          onClick={handleAddNote}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Add note"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-3">No notes yet</p>
            <button
              onClick={handleAddNote}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add your first note
            </button>
          </div>
        ) : (
          notes.map((note, index) => (
            <div
              key={note.id}
              className="group p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
            >
              {/* Note Number + Linked Highlights */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-700">
                  Note {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {note.linkedHighlightIds.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <LinkIcon className="h-3 w-3" />
                      {note.linkedHighlightIds.length}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Delete note"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Body Input */}
              <textarea
                value={note.body}
                onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                onFocus={() => setEditingId(note.id)}
                onBlur={() => setEditingId(null)}
                onClick={() => onNoteClick?.(note)}
                placeholder="Write your notes here..."
                className="w-full text-sm text-gray-900 bg-transparent border-none resize-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
                rows={3}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
