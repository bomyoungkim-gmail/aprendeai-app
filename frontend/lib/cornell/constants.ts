/**
 * Cornell Notes Constants
 * 
 * Centralized constants for Cornell Notes functionality
 */

export const CORNELL_MODAL_CONSTANTS = {
  TEXTAREA_ROWS: 8,
  DEFAULT_PAGE_NUMBER: 1,
  MIN_PAGE_NUMBER: 1,
} as const;

export const CORNELL_MODAL_DEFAULTS = {
  TYPE: 'NOTE' as const,
  PAGE: 1,
  CONTEXT: 'PERSONAL' as const,
} as const;

// Cornell Annotation Types (Core - Single Source of Truth)
export const CORNELL_TYPES = {
  HIGHLIGHT: 'HIGHLIGHT',
  NOTE: 'NOTE',
  IMPORTANT: 'IMPORTANT',
  QUESTION: 'QUESTION',
} as const;

// Extended types (includes synthesis and AI)
export const CORNELL_EXTENDED_TYPES = {
  ...CORNELL_TYPES,
  SYNTHESIS: 'SYNTHESIS',
  AI: 'AI',
} as const;

export type CornellType = typeof CORNELL_TYPES[keyof typeof CORNELL_TYPES];
export type CornellExtendedType = typeof CORNELL_EXTENDED_TYPES[keyof typeof CORNELL_EXTENDED_TYPES];
