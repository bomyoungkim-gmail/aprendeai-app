/**
 * Cornell Notes - Type to Color Mapping
 * 
 * Maps Cornell annotation types to fixed colors and semantic tags.
 * This allows visual differentiation without creating new backend enums.
 * 
 * Color Strategy:
 * - HIGHLIGHT (blue): General highlighting
 * - NOTE (green): Detailed notes/annotations
 * - STAR/Important (yellow): Key concepts
 * - QUESTION (red): Questions/doubts
 * 
 * @module lib/cornell/type-color-map
 */

import { ColorKey } from '@/lib/constants/colors';
import { HighlightType } from '@/lib/cornell/labels';

/**
 * Maps Cornell annotation types to their designated colors
 */
export const CORNELL_TYPE_COLOR_MAP: Record<Exclude<HighlightType, 'AI_RESPONSE'>, ColorKey> = {
  HIGHLIGHT: 'blue',    // 🔵💙 General highlighting
  NOTE: 'green',        // 🟢💚 Detailed annotations
  STAR: 'yellow',       // 🟡💛 Important/key concepts
  QUESTION: 'red',      // 🔴❤️ Questions/doubts
  SUMMARY: 'yellow',    // Not used in Highlight (goes to CornellNotes.summaryText)
};

/**
 * Maps Cornell annotation types to semantic tags for filtering/querying
 */
export const CORNELL_TYPE_TAGS: Record<HighlightType, string[]> = {
  HIGHLIGHT: ['highlight'],
  NOTE: ['note'],
  STAR: ['star', 'important'],
  QUESTION: ['question'],
  SUMMARY: ['summary'],
  AI_RESPONSE: ['ai-response'],
};

/**
 * Get color for a given Cornell type
 */
export function getColorForCornellType(type: HighlightType): ColorKey {
  return CORNELL_TYPE_COLOR_MAP[type as Exclude<HighlightType, 'AI_RESPONSE'>] || 'blue';
}

/**
 * Get tags for a given Cornell type
 */
export function getTagsForCornellType(type: HighlightType): string[] {
  return CORNELL_TYPE_TAGS[type] || [];
}

/**
 * Infer Cornell type from color and tags
 * Used when reading existing highlights
 */
export function inferCornellType(colorKey: string, tags: string[]): HighlightType {
  // Check tags first (more reliable)
  if (tags.includes('question')) return 'QUESTION';
  if (tags.includes('star') || tags.includes('important')) return 'STAR';
  if (tags.includes('note')) return 'NOTE';
  if (tags.includes('summary')) return 'SUMMARY';
  if (tags.includes('ai-response')) return 'AI_RESPONSE';
  
  // Fall back to color
  if (colorKey === 'red') return 'QUESTION';
  if (colorKey === 'yellow') return 'STAR';
  if (colorKey === 'green') return 'NOTE';
  
  return 'HIGHLIGHT';
}
