/**
 * Cornell Notes - Type to Color Mapping (Backend)
 * 
 * Mirrors frontend mapping to ensure consistency.
 * Used for server-side validation and data processing.
 * 
 * @module cornell/constants/cornell-type-map
 */

/**
 * Cornell annotation types
 * Matches frontend HighlightType
 */
export type CornellType = 'HIGHLIGHT' | 'NOTE' | 'STAR' | 'QUESTION' | 'SUMMARY' | 'AI_RESPONSE';

/**
 * Valid color keys for highlights
 * Matches frontend ColorKey
 */
export type ColorKey = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'orange';

/**
 * Maps Cornell annotation types to their designated colors
 * MUST match frontend lib/cornell/type-color-map.ts
 */
export const CORNELL_TYPE_COLOR_MAP: Record<Exclude<CornellType, 'AI_RESPONSE'>, ColorKey> = {
  HIGHLIGHT: 'blue',
  NOTE: 'green',
  STAR: 'yellow',
  QUESTION: 'red',
  SUMMARY: 'yellow',
};

/**
 * Maps Cornell annotation types to semantic tags
 * MUST match frontend lib/cornell/type-color-map.ts
 */
export const CORNELL_TYPE_TAGS: Record<CornellType, string[]> = {
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
export function getColorForType(type: CornellType): ColorKey {
  return CORNELL_TYPE_COLOR_MAP[type as Exclude<CornellType, 'AI_RESPONSE'>] || 'blue';
}

/**
 * Get tags for a given Cornell type
 */
export function getTagsForType(type: CornellType): string[] {
  return CORNELL_TYPE_TAGS[type] || [];
}

/**
 * Validate if a type is a valid Cornell type
 */
export function isValidCornellType(type: string): type is CornellType {
  return ['HIGHLIGHT', 'NOTE', 'STAR', 'QUESTION', 'SUMMARY', 'AI_RESPONSE'].includes(type);
}
