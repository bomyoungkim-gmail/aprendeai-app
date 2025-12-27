/**
 * Cornell Highlight List
 * 
 * Renders list of Cornell highlights with actions.
 */

'use client';

import React from 'react';
import { CornellHighlightItem } from './CornellHighlightItem';
import type { Highlight } from '@/hooks/cornell/use-cornell-highlights';

export interface CornellHighlightListProps {
  highlights: Highlight[];
  contentId: string;
  onHighlightSelect?: (highlightId: string) => void;
}

export function CornellHighlightList({
  highlights,
  contentId,
  onHighlightSelect,
}: CornellHighlightListProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="divide-y divide-gray-200">
      {highlights.map((highlight) => (
        <CornellHighlightItem
          key={highlight.id}
          highlight={highlight}
          contentId={contentId}
          onSelect={() => onHighlightSelect?.(highlight.id)}
        />
      ))}
    </div>
  );
}
