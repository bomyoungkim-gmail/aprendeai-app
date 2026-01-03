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
  // Robust check for snake_case tags_json from backend
  let annotationType = 'EVIDENCE';
  let streamType: UnifiedStreamItemType = 'evidence';
  
  const tags = highlight.tagsJson || (highlight as any).tags_json || [];
  const lowerTags = tags.map((t: string) => t.toLowerCase());
  
  if (lowerTags.some((t: string) => ['doubt', 'question', 'duvida'].includes(t))) {
    annotationType = 'DOUBT';
    streamType = 'doubt';
  } else if (lowerTags.some((t: string) => ['main-idea', 'star', 'important', 'ideia-central'].includes(t))) {
    annotationType = 'MAIN_IDEA';
    streamType = 'main-idea';
  } else if (lowerTags.some((t: string) => ['vocab', 'note', 'vocabulary', 'vocabulario'].includes(t))) {
    annotationType = 'VOCABULARY';
    streamType = 'vocabulary';
  } else if (lowerTags.some((t: string) => ['ai'].includes(t))) {
    annotationType = 'AI';
    streamType = 'ai';
  }
    
  return {
    id: highlight.id,
    type: streamType,
    createdAt: highlight.createdAt || (highlight as any).created_at || new Date().toISOString(),
    updatedAt: highlight.updatedAt || (highlight as any).updated_at || new Date().toISOString(),
    highlight,
    annotationType,
    colorKey: highlight.colorKey,
    quote,
    pageNumber: highlight.pageNumber || (highlight as any).page_number,
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
 * Sorts unified stream:
 * 1. By Page Number (Ascending)
 * 2. By Creation Date (Oldest First) - Chronological order within the page
 */
export function sortStreamItems(items: UnifiedStreamItem[]): UnifiedStreamItem[] {
  return [...items].sort((a, b) => {
    // 1. Primary Sort: Page Number
    // Robustly check top-level pageNumber, then nested highlight.pageNumber, default to infinity to push to bottom
    const getPage = (item: any) => {
      if (typeof item.pageNumber === 'number') return item.pageNumber;
      if (item.highlight && typeof item.highlight.pageNumber === 'number') return item.highlight.pageNumber;
      // Also check anchorJson if needed, but highlight.pageNumber should be there from adapter
      return 999999; 
    };

    const pageA = getPage(a);
    const pageB = getPage(b);

    if (pageA !== pageB) {
      if (pageA === -1) return 1; // Items without page go to bottom
      if (pageB === -1) return -1;
      return pageA - pageB; // Ascending page order
    }

    // 2. Secondary Sort: Chronological (Oldest First)
    // "mais antigo no topo e mais recente em baixo" -> Ascending date sort
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return dateA - dateB;
  });
}

export type SidebarTab = 'toc' | 'stream' | 'synthesis' | 'analytics' | 'chat';
