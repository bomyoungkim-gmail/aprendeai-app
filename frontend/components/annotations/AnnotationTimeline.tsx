'use client';

import { MessageSquare, Bookmark } from 'lucide-react';

interface Annotation {
  id: string;
  type: 'HIGHLIGHT' | 'NOTE';
  timestamp?: number;
  endTimestamp?: number;
  text?: string;
  color?: string;
}

interface AnnotationTimelineProps {
  annotations: Annotation[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onCreateAnnotation?: (timestamp: number) => void;
}

export function AnnotationTimeline({
  annotations,
  duration,
  currentTime,
  onSeek,
  onCreateAnnotation,
}: AnnotationTimelineProps) {
  // Filter annotations with timestamps
  const timestampedAnnotations = annotations.filter(a => a.timestamp !== undefined);

  // Calculate position percentage for each annotation
  const getPosition = (timestamp: number) => {
    if (duration === 0) return 0;
    return (timestamp / duration) * 100;
  };

  // Get color for annotation marker
  const getMarkerColor = (annotation: Annotation) => {
    if (annotation.color) {
      const colorMap: Record<string, string> = {
        yellow: 'bg-yellow-400',
        green: 'bg-green-400',
        blue: 'bg-blue-400',
        pink: 'bg-pink-400',
      };
      return colorMap[annotation.color] || 'bg-gray-400';
    }
    return annotation.type === 'NOTE' ? 'bg-blue-500' : 'bg-yellow-400';
  };

  return (
    <div className="relative w-full h-8 mt-2">
      {/* Annotation markers */}
      {timestampedAnnotations.map((annotation) => {
        const position = getPosition(annotation.timestamp!);
        const isActive = 
          currentTime >= annotation.timestamp! &&
          (!annotation.endTimestamp || currentTime <= annotation.endTimestamp);

        return (
          <div
            key={annotation.id}
            className="absolute group"
            style={{ left: `${position}%`, top: '0' }}
          >
            {/* Marker */}
            <button
              onClick={() => onSeek(annotation.timestamp!)}
              className={`w-2 h-8 ${getMarkerColor(annotation)} ${
                isActive ? 'opacity-100 scale-125' : 'opacity-70 hover:opacity-100'
              } transition-all cursor-pointer`}
              title={`${annotation.type} at ${Math.floor(annotation.timestamp! / 60)}:${
                Math.floor(annotation.timestamp! % 60).toString().padStart(2, '0')
              }`}
            />

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-xs truncate">
                <div className="flex items-center gap-1 mb-1">
                  {annotation.type === 'NOTE' ? (
                    <MessageSquare className="w-3 h-3" />
                  ) : (
                    <Bookmark className="w-3 h-3" />
                  )}
                  <span className="font-medium">
                    {Math.floor(annotation.timestamp! / 60)}:
                    {Math.floor(annotation.timestamp! % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                {annotation.text && (
                  <div className="text-gray-300 truncate max-w-[200px]">
                    {annotation.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add annotation button at current time */}
      {onCreateAnnotation && (
        <button
          onClick={() => onCreateAnnotation(currentTime)}
          className="absolute top-0 h-8 w-8 flex items-center justify-center bg-white border-2 border-blue-500 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
          style={{ left: `${getPosition(currentTime)}%`, transform: 'translateX(-50%)' }}
          title="Add annotation at current time"
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
        </button>
      )}
    </div>
  );
}
