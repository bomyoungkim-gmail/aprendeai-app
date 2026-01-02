import React from 'react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import {
  AnnotationCard,
  NoteCard,
  QuestionCard,
  ImportantCard,
} from './stream-cards';

interface StreamCardProps {
  item: UnifiedStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

/**
 * StreamCard - Router component for different stream item types
 * 
 * Routes to specialized card components based on item type:
 * - annotation → AnnotationCard
 * - note → NoteCard
 * - question → QuestionCard
 * - important (star) → StarCard
 */
export function StreamCard({ item, onClick, onEdit, onDelete, onSaveEdit }: StreamCardProps) {
  switch (item.type) {
    case 'annotation':
      return <AnnotationCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
    
    case 'note':
      return <NoteCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
    
    case 'question':
      return <QuestionCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    case 'important':
      return <ImportantCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    default:
      return null;
  }
}
