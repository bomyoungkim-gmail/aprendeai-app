// Unified Knowledge Stream Types for Cornell Notes
// This combines Annotations (Highlights) and Notes into a single stream

import type { Highlight, NoteItem, CueItem } from './cornell';

/**
 * Unified Stream Item - represents any entry in the knowledge sidebar
 */
export type UnifiedStreamItemType = 
  | 'annotation' 
  | 'note' 
  | 'ai-suggestion'
  | 'question'      // User-generated question
  | 'important'     // Important highlight (renamed from star)
  | 'synthesis'     // Synthesis/summary
  | 'ai-response'   // AI's answer to a question
  | 'triage'        // Item for triage/review
  | 'ai';           // Generic AI request type

export interface BaseStreamItem {
  id: string;
  type: UnifiedStreamItemType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Annotation Stream Item - represents a highlight/anchor
 */
export interface AnnotationStreamItem extends BaseStreamItem {
  type: 'annotation';
  highlight: Highlight;
  // Quick access fields
  colorKey: string;
  quote?: string;
  pageNumber?: number;
  commentText?: string;
}

/**
 * Note Stream Item - represents user synthesis
 */
export interface NoteStreamItem extends BaseStreamItem {
  type: 'note';
  note: NoteItem;
  // Quick access
  body: string;
}

/**
 * AI Suggestion Stream Item - represents AI-generated content
 */
export interface AISuggestionStreamItem extends BaseStreamItem {
  type: 'ai-suggestion';
  content: string;
  suggestionType: 'cue' | 'summary' | 'explanation';
  sourcePageNumber?: number;
  accepted: boolean;
}

/**
 * Question Stream Item - represents a user question
 */
export interface QuestionStreamItem extends BaseStreamItem {
  type: 'question';
  question: string;
  section?: string;
  pageNumber?: number;
  resolved?: boolean;
  aiResponseId?: string; // Link to AI answer
}

/**
 * Important Stream Item - represents an important highlight
 */
export interface ImportantStreamItem extends BaseStreamItem {
  type: 'important';
  quote: string;
  section?: string;
  pageNumber?: number;
  note?: string; // Optional note on why it's important
}

/**
 * AI Response Stream Item - represents AI's answer to a question
 */
export interface AIResponseStreamItem extends BaseStreamItem {
  type: 'ai-response';
  response: string;
  questionId: string; // Link to original question
  helpful?: boolean; // User feedback
}

export type UnifiedStreamItem = 
  | AnnotationStreamItem 
  | NoteStreamItem 
  | AISuggestionStreamItem
  | QuestionStreamItem
  | ImportantStreamItem
  | AIResponseStreamItem;

/**
 * Helper to convert Highlight to AnnotationStreamItem
 */
export function highlightToStreamItem(highlight: Highlight): AnnotationStreamItem {
  const quote = highlight.anchorJson.type === 'PDF_TEXT' 
    ? highlight.anchorJson.quote 
    : undefined;
    
  return {
    id: highlight.id,
    type: 'annotation',
    createdAt: highlight.createdAt,
    updatedAt: highlight.updatedAt,
    highlight,
    colorKey: highlight.colorKey,
    quote,
    pageNumber: highlight.pageNumber,
    commentText: highlight.commentText,
  };
}

/**
 * Helper to convert NoteItem to NoteStreamItem
 */
export function noteToStreamItem(note: NoteItem, createdAt: string): NoteStreamItem {
  return {
    id: note.id,
    type: 'note',
    createdAt,
    updatedAt: createdAt,
    note,
    body: note.body,
  };
}

/**
 * Sort unified stream by creation date (newest first)
 */
export function sortStreamItems(items: UnifiedStreamItem[]): UnifiedStreamItem[] {
  return [...items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export type SidebarTab = 'toc' | 'stream' | 'synthesis' | 'analytics' | 'chat';
