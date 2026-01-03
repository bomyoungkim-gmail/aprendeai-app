/**
 * Cornell Type to Color Mapping
 * 
 * Maps Cornell annotation types to their visual colors.
 * 
 * Color Scheme:
 * - HIGHLIGHT (blue): General highlighting
 * - NOTE (green): Detailed notes/annotations
 * - IMPORTANT (yellow): Key concepts (renamed from STAR)
 * - QUESTION (red): Questions/doubts
 * - SYNTHESIS (purple): Synthesis/summary
 */

import { CORNELL_EXTENDED_TYPES } from './constants';

const TYPE_TO_COLOR: Record<string, string> = {
  EVIDENCE: 'yellow',
  VOCABULARY: 'blue',
  MAIN_IDEA: 'green',
  DOUBT: 'red',
  SYNTHESIS: 'purple',
  AI: 'purple',
};

const TYPE_TO_TAGS: Record<string, string[]> = {
  EVIDENCE: ['evidence', 'highlight'],
  VOCABULARY: ['vocab', 'note'],
  MAIN_IDEA: ['main-idea', 'important', 'star'],
  DOUBT: ['doubt', 'question'],
  SYNTHESIS: ['synthesis'],
  AI: ['ai'],
};


/**
 * Get color for a given Cornell type
 */
export function getColorForCornellType(type: string): string {
  return TYPE_TO_COLOR[type] || 'blue';
}

/**
 * Get tags for a given Cornell type
 */
export function getTagsForCornellType(type: string): string[] {
  return TYPE_TO_TAGS[type] || [];
}

/**
 * Infer Cornell type from color and tags
 * Used when reading existing highlights (with backward compatibility)
 */
export function inferCornellType(colorKey: string, tags: string[]): string {
  // Check tags first (more reliable) - Safe access
  const safeTags = tags || [];
  if (safeTags.some(t => ['doubt', 'question'].includes(t.toLowerCase()))) return 'DOUBT';
  if (safeTags.some(t => ['main-idea', 'important', 'star'].includes(t.toLowerCase()))) return 'MAIN_IDEA';
  if (safeTags.some(t => ['vocab', 'note'].includes(t.toLowerCase()))) return 'VOCABULARY';
  if (safeTags.some(t => ['synthesis', 'summary'].includes(t.toLowerCase()))) return 'SYNTHESIS';
  if (safeTags.includes('ai')) return 'AI';
  
  // Fall back to color
  if (colorKey === 'red') return 'DOUBT';
  if (colorKey === 'green') return 'MAIN_IDEA';
  if (colorKey === 'blue') return 'VOCABULARY';
  if (colorKey === 'purple') return 'SYNTHESIS';
  if (colorKey === 'yellow') return 'EVIDENCE';
  
  return 'EVIDENCE';
}
