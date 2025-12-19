'use client';

import { useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function TranscriptViewer({
  segments,
  currentTime,
  onSeek,
  className = '',
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Filter segments by search query
  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find current segment
  const currentSegmentIndex = segments.findIndex(
    s => currentTime >= s.start && currentTime <= s.end
  );

  // Export transcript as text
  const handleExport = () => {
    const text = segments
      .map(s => `[${formatTime(s.start)}] ${s.text}`)
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!segments || segments.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcript</h3>
        <p className="text-gray-500 text-sm">
          Transcription not available for this content.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700"
        >
          Transcript
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export transcript"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segments */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {filteredSegments.map((segment, index) => {
            const isCurrent = index === currentSegmentIndex;
            const originalIndex = segments.findIndex(s => s.id === segment.id);

            return (
              <div
                key={segment.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSeek(segment.start)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-500 mt-0.5 min-w-[45px]">
                    {formatTime(segment.start)}
                  </span>
                  <p
                    className={`text-sm flex-1 ${
                      isCurrent ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {searchQuery && (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: segment.text.replace(
                            new RegExp(searchQuery, 'gi'),
                            match => `<mark class="bg-yellow-200">${match}</mark>`
                          ),
                        }}
                      />
                    )}
                    {!searchQuery && segment.text}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredSegments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
