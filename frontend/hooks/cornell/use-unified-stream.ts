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

    // Add Cornell notes as note/synthesis items
    const notesArray = cornellNotes?.notesJson || (cornellNotes as any)?.notes_json;
    if (notesArray) {
      notesArray.forEach((note: any) => {
        // Use updatedAt from the Cornell document as proxy for note creation time
        if (note.type === 'synthesis') {
          items.push({
            id: note.id,
            type: 'synthesis',
            createdAt: cornellNotes.updatedAt,
            updatedAt: cornellNotes.updatedAt,
            body: note.body,
            anchor: note.anchor,
          });
        } else {
          items.push(noteToStreamItem(note, cornellNotes.updatedAt));
        }
      });
    }

    // Sort by creation date (newest first)
    return sortStreamItems(items);
  }, [highlights, cornellNotes]);

  return {
    streamItems,
    isLoading: highlightsLoading || notesLoading,
    highlights,
    notes: cornellNotes?.notesJson || (cornellNotes as any)?.notes_json || [],
    summary: cornellNotes?.summaryText || (cornellNotes as any)?.summary_text || '',
    cues: cornellNotes?.cuesJson || (cornellNotes as any)?.cues_json || [],
  };
}
