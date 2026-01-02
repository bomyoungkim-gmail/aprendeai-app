import React from 'react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import {
  AnnotationCard,
  NoteCard,
  AISuggestionCard,
  QuestionCard,
  StarCard,
  AIResponseCard,
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
 * - ai-suggestion → AISuggestionCard
 * - question → QuestionCard
 * - star → StarCard
 * - ai-response → AIResponseCard
 */
export function StreamCard({ item, onClick, onEdit, onDelete, onSaveEdit }: StreamCardProps) {
  switch (item.type) {
    case 'annotation':
      return <AnnotationCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
    
    case 'note':
      return <NoteCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
    
    case 'ai-suggestion':
      return <AISuggestionCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    case 'question':
      return <QuestionCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    case 'star':
      return <StarCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    case 'ai-response':
      return <AIResponseCard item={item} onClick={onClick} onDelete={onDelete} />;
    
    default:
      return null;
  }
}
