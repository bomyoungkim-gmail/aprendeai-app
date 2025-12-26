import { useState, useCallback } from 'react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

/**
 * Custom hook for managing card editing state
 * Eliminates duplication between AnnotationCard and NoteCard
 */
export function useCardEditor<T>(
  item: UnifiedStreamItem,
  onSaveEdit?: (item: UnifiedStreamItem, updates: T) => void
) {
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(
    (updates: T) => {
      onSaveEdit?.(item, updates);
      setIsEditing(false);
    },
    [item, onSaveEdit]
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    startEditing,
    handleSave,
    handleCancel,
  };
}
