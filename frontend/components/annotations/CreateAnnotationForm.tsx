'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useCreateAnnotation } from '@/hooks/use-annotations';
import { useAutoTrackAnnotation } from '@/hooks/use-auto-track';

interface CreateAnnotationFormProps {
  contentId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateAnnotationForm({
  contentId,
  startOffset,
  endOffset,
  selectedText,
  onSuccess,
  onCancel,
}: CreateAnnotationFormProps) {
  const [note, setNote] = useState('');
  const [color, setColor] = useState('yellow');
  const [type, setType] = useState<'HIGHLIGHT' | 'NOTE'>('HIGHLIGHT');

  const { mutate: createAnnotation, isPending } = useCreateAnnotation(contentId);
  const trackAnnotation = useAutoTrackAnnotation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createAnnotation(
      {
        type,
        startOffset,
        endOffset,
        selectedText,
        text: note || undefined,
        color,
        visibility: 'PRIVATE',
      },
      {
        onSuccess: () => {
          // Track annotation creation
          trackAnnotation();
          
          setNote('');
          onSuccess?.();
        },
      }
    );
  };

  const colors = [
    { name: 'yellow', class: 'bg-yellow-300' },
    { name: 'green', class: 'bg-green-300' },
    { name: 'blue', class: 'bg-blue-300' },
    { name: 'pink', class: 'bg-pink-300' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Add Annotation</h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Selected Text */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
        "{selectedText.length > 100 ? selectedText.slice(0, 100) + '...' : selectedText}"
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('HIGHLIGHT')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'HIGHLIGHT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Highlight
          </button>
          <button
            type="button"
            onClick={() => setType('NOTE')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'NOTE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Note
          </button>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                className={`w-8 h-8 rounded-full ${c.class} ${
                  color === c.name ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Note Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your thoughts..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
