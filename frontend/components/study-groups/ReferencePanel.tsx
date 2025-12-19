'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ExternalLink } from 'lucide-react';

interface Highlight {
  id: string;
  text: string;
  createdAt: string;
}

interface ReferencePanelProps {
  contentId: string;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
}

export function ReferencePanel({ contentId, selectedIds, onSelectIds }: ReferencePanelProps) {
  const { data: highlights, isLoading } = useQuery({
    queryKey: ['highlights', contentId],
    queryFn: async () => {
      const { data } = await api.get<Highlight[]>(`/contents/${contentId}/highlights`);
      return data;
    },
  });

  const handleToggleHighlight = (highlightId: string) => {
    if (selectedIds.includes(highlightId)) {
      onSelectIds(selectedIds.filter(id => id !== highlightId));
    } else {
      onSelectIds([...selectedIds, highlightId]);
    }
  };

  const handleOpenCornell = () => {
    window.open(`/reader/${contentId}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">Reference Panel</h3>
      
      <button
        onClick={handleOpenCornell}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        <ExternalLink className="w-4 h-4" />
        Open Cornell Reader
      </button>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Your Highlights:</h4>
        
        {isLoading && (
          <div className="text-sm text-gray-600">Loading highlights...</div>
        )}

        {!isLoading && (!highlights || highlights.length === 0) && (
          <div className="text-sm text-gray-600">
            No highlights yet. Open Cornell Reader to create highlights.
          </div>
        )}

        {highlights && highlights.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {highlights.map((hl) => (
              <label
                key={hl.id}
                className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(hl.id)}
                  onChange={() => handleToggleHighlight(hl.id)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  {hl.text.length > 150 ? `${hl.text.slice(0, 150)}...` : hl.text}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          Selected: {selectedIds.length} highlight(s)
        </div>
      </div>
    </div>
  );
}
