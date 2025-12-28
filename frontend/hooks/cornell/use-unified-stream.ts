import { useMemo } from 'react';
import { useHighlights, useCornellNotes } from './use-data';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { highlightToStreamItem, noteToStreamItem, sortStreamItems } from '@/lib/types/unified-stream';

/**
 * Hook to get unified stream of annotations and notes
 * Combines highlights and Cornell notes into a single sorted array
 */
export function useUnifiedStream(contentId: string) {
  const { data: highlights, isLoading: highlightsLoading } = useHighlights(contentId);
  const { data: cornellNotes, isLoading: notesLoading } = useCornellNotes(contentId);

  const streamItems = useMemo<UnifiedStreamItem[]>(() => {
    const items: UnifiedStreamItem[] = [];

    // Add highlights as annotation items
    if (highlights) {
      highlights.forEach(highlight => {
        items.push(highlightToStreamItem(highlight));
      });
    }

    // Add Cornell notes as note items
    if (cornellNotes?.notesJson) {
      cornellNotes.notesJson.forEach(note => {
        // Use updatedAt from the Cornell document as proxy for note creation time
        items.push(noteToStreamItem(note, cornellNotes.updatedAt));
      });
    }

    // Sort by creation date (newest first)
    return sortStreamItems(items);
  }, [highlights, cornellNotes]);

  return {
    streamItems,
    isLoading: highlightsLoading || notesLoading,
    highlights,
    notes: cornellNotes?.notesJson || [],
    summary: cornellNotes?.summaryText || '',
    cues: cornellNotes?.cuesJson || [],
  };
}
