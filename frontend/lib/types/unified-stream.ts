// Unified Knowledge Stream Types for Cornell Notes
// This combines Annotations (Highlights) and Notes into a single stream

import type { Highlight, NoteItem, SynthesisCategory, SynthesisAnchor } from './cornell';
export type { SynthesisCategory, SynthesisAnchor };

/**
 * Unified Stream Item - represents any entry in the knowledge sidebar
 */
export type UnifiedStreamItemType = 
  | 'evidence'       // Highlight-based evidence
  | 'vocabulary'     // Highlight-based vocabulary
  | 'main-idea'      // Highlight-based main idea
  | 'doubt'          // Highlight-based doubt
  | 'note'           // Manual user note
  | 'synthesis'      // Manual synthesis/summary
  | 'ai-suggestion'  // AI-generated content
  | 'ai-response'    // AI's answer to a doubt
  | 'triage'         // Item for triage/review
  | 'ai';            // Generic AI request type

export interface BaseStreamItem {
  id: string;
  type: UnifiedStreamItemType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Base Highlight Stream Item - common fields for all highlight-based items
 */
export interface BaseHighlightStreamItem extends BaseStreamItem {
  highlight: Highlight;
  // Quick access fields
  annotationType: string;
  colorKey: string;
  quote?: string;
  pageNumber?: number;
  commentText?: string;
}

export interface EvidenceStreamItem extends BaseHighlightStreamItem {
  type: 'evidence';
}

export interface VocabularyStreamItem extends BaseHighlightStreamItem {
  type: 'vocabulary';
}

export interface MainIdeaStreamItem extends BaseHighlightStreamItem {
  type: 'main-idea';
}

export interface DoubtStreamItem extends BaseHighlightStreamItem {
  type: 'doubt';
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

// MainIdeaStreamItem and DoubtStreamItem redefined above as BaseHighlightStreamItem extensions

/**
 * AI Response Stream Item - represents AI's answer to a question
 */
export interface AIResponseStreamItem extends BaseStreamItem {
  type: 'ai-response';
  response: string;
  questionId: string; // Link to original question
  helpful?: boolean; // User feedback
}

// Synthesis definitions moved to cornell.ts

/**
 * Synthesis Stream Item - represents global or anchored document summary
 */
export interface SynthesisStreamItem extends BaseStreamItem {
  type: 'synthesis';
  body: string;
  anchor?: SynthesisAnchor;
}

export type UnifiedStreamItem = 
  | EvidenceStreamItem
  | VocabularyStreamItem
  | MainIdeaStreamItem
  | DoubtStreamItem
  | NoteStreamItem 
  | AISuggestionStreamItem
  | AIResponseStreamItem
  | SynthesisStreamItem;

/**
 * Helper to convert Highlight to UnifiedStreamItem
 */
export function highlightToStreamItem(highlight: Highlight): UnifiedStreamItem {
  const quote = highlight.anchorJson?.type === 'PDF_TEXT' 
    ? highlight.anchorJson.quote 
    : undefined;

  // Infer annotation type from tags
  let annotationType = 'EVIDENCE';
  let streamType: UnifiedStreamItemType = 'evidence';
  
  const tags = highlight.tagsJson || [];
  const lowerTags = tags.map(t => t.toLowerCase());
  
  if (lowerTags.some(t => ['doubt', 'question'].includes(t))) {
    annotationType = 'DOUBT';
    streamType = 'doubt';
  } else if (lowerTags.some(t => ['main-idea', 'star', 'important'].includes(t))) {
    annotationType = 'MAIN_IDEA';
    streamType = 'main-idea';
  } else if (lowerTags.some(t => ['vocab', 'note'].includes(t))) {
    annotationType = 'VOCABULARY';
    streamType = 'vocabulary';
  } else if (lowerTags.some(t => ['ai'].includes(t))) {
    annotationType = 'AI';
    streamType = 'ai';
  }
    
  return {
    id: highlight.id,
    type: streamType,
    createdAt: highlight.createdAt,
    updatedAt: highlight.updatedAt,
    highlight,
    annotationType,
    colorKey: highlight.colorKey,
    quote,
    pageNumber: highlight.pageNumber,
    commentText: highlight.commentText || (highlight as any).comment_text,
  } as UnifiedStreamItem;
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
