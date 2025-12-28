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
