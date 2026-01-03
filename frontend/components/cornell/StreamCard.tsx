import React from 'react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { AnnotationCard, NoteCard } from './stream-cards';

interface StreamCardProps {
  item: UnifiedStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

/**
 * StreamCard - Router component for different stream item types
 */
export function StreamCard({ item, onClick, onEdit, onDelete, onSaveEdit }: StreamCardProps) {
  switch (item.type) {
    case 'annotation':
    case 'important':
    case 'question':
      return (
        <AnnotationCard 
          item={item} 
          onClick={onClick} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onSaveEdit={onSaveEdit} 
        />
      );

    case 'note':
    case 'synthesis':
      return (
        <NoteCard 
          item={item} 
          onClick={onClick} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onSaveEdit={onSaveEdit} 
        />
      );
    
    default:
      return null;
  }
}
