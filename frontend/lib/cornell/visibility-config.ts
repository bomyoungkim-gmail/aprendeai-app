/**
 * Cornell Notes Visibility Configuration
 * 
 * Manages automatic visibility configuration based on context
 */

import type { ContextTypeKey } from './types';

export interface VisibilityConfig {
  visibility: 'PRIVATE' | 'GROUP' | 'PUBLIC';
  visibility_scope?: 'STUDY_GROUP' | 'FAMILY' | 'INSTITUTION';
  context_type?: 'STUDY_GROUP' | 'FAMILY' | 'INSTITUTION';
  context_id?: string;
}

const VISIBILITY_MAPPINGS: Record<ContextTypeKey, Omit<VisibilityConfig, 'context_id'>> = {
  PERSONAL: {
    visibility: 'PRIVATE',
  },
  STUDY_GROUP: {
    visibility: 'GROUP',
    visibility_scope: 'STUDY_GROUP',
    context_type: 'STUDY_GROUP',
  },
  FAMILY: {
    visibility: 'GROUP',
    visibility_scope: 'FAMILY',
    context_type: 'FAMILY',
  },
  INSTITUTION: {
    visibility: 'GROUP',
    visibility_scope: 'INSTITUTION',
    context_type: 'INSTITUTION',
  },
};

/**
 * Get visibility configuration based on context type
 */
export function getVisibilityConfig(
  contextType: ContextTypeKey,
  contextId?: string
): VisibilityConfig {
  const baseConfig = VISIBILITY_MAPPINGS[contextType] || VISIBILITY_MAPPINGS.PERSONAL;
  
  return contextId && contextType !== 'PERSONAL'
    ? { ...baseConfig, context_id: contextId }
    : baseConfig;
}
