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
  HIGHLIGHT: 'blue',
  NOTE: 'green',
  IMPORTANT: 'yellow',  // ✅ Renamed from STAR
  QUESTION: 'red',
  SYNTHESIS: 'purple',  // ✅ Renamed from SUMMARY
  AI: 'purple',
};

const TYPE_TO_TAGS: Record<string, string[]> = {
  HIGHLIGHT: ['highlight'],
  NOTE: ['note'],
  IMPORTANT: ['important'],
  QUESTION: ['question'],
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
  // Check tags first (more reliable)
  if (tags.includes('question')) return 'QUESTION';
  if (tags.includes('important')) return 'IMPORTANT';
  if (tags.includes('note')) return 'NOTE';
  if (tags.includes('synthesis')) return 'SYNTHESIS';
  if (tags.includes('ai')) return 'AI';
  
  // Fall back to color
  if (colorKey === 'red') return 'QUESTION';
  if (colorKey === 'yellow') return 'IMPORTANT';
  if (colorKey === 'green') return 'NOTE';
  if (colorKey === 'purple') return 'SYNTHESIS';
  
  return 'HIGHLIGHT';
}
