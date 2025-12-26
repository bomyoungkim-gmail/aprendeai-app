/**
 * Visibility Helper Hook
 * 
 * Helper functions for Cornell Notes granular sharing logic.
 */

import {
  ContextType,
  VisibilityScope,
  AnnotationVisibility,
  isEducatorRole,
  getAvailableScopes as getAvailableScopesFromEnums,
} from '@/lib/constants/enums';

export interface VisibilityConfig {
  visibility: AnnotationVisibility;
  scope?: VisibilityScope;
  contextType?: ContextType;
  contextId?: string;
  learnerId?: string;
}

export interface ContextInfo {
  type: ContextType;
  id: string;
  name: string;
}

/**
 * Get available visibility scopes for a context type
 */
export function useVisibilityScopes(contextType?: ContextType) {
  if (!contextType) return [];
  return getAvailableScopesFromEnums(contextType);
}

/**
 * Validate visibility configuration
 */
export function validateVisibilityConfig(
  config: VisibilityConfig
): { valid: boolean; error?: string } {
  // PRIVATE doesn't need extra fields
  if (config.visibility === AnnotationVisibility.PRIVATE) {
    return { valid: true };
  }

  // PUBLIC doesn't need extra fields
  if (config.visibility === AnnotationVisibility.PUBLIC) {
    return { valid: true };
  }

  // GROUP requires context
  if (config.visibility === AnnotationVisibility.GROUP) {
    if (!config.contextType || !config.contextId) {
      return {
        valid: false,
        error: 'Context type and ID required for GROUP visibility',
      };
    }

    if (!config.scope) {
      return {
        valid: false,
        error: 'Visibility scope required for GROUP visibility',
      };
    }

    // RESPONSIBLES_OF_LEARNER requires learner ID
    if (config.scope === VisibilityScope.RESPONSIBLES_OF_LEARNER && !config.learnerId) {
      return {
        valid: false,
        error: 'Learner ID required for RESPONSIBLES_OF_LEARNER scope',
      };
    }

    return { valid: true };
  }

  return { valid: false, error: 'Invalid visibility type' };
}

/**
 * Get human-readable description for visibility config
 */
export function getVisibilityDescription(config: VisibilityConfig): string {
  if (config.visibility === AnnotationVisibility.PRIVATE) {
    return 'Apenas você';
  }

  if (config.visibility === AnnotationVisibility.PUBLIC) {
    return 'Público (todos)';
  }

  if (config.visibility === AnnotationVisibility.GROUP && config.scope) {
    switch (config.scope) {
      case VisibilityScope.CLASS_PROJECT:
        return 'Projeto de Classe (educadores + alunos)';
      case VisibilityScope.ONLY_EDUCATORS:
        return 'Apenas Educadores';
      case VisibilityScope.RESPONSIBLES_OF_LEARNER:
        return 'Responsáveis do Aluno';
      case VisibilityScope.GROUP_MEMBERS:
        return 'Membros do Grupo';
      default:
        return 'Compartilhado no grupo';
    }
  }

  return 'Não definido';
}

/**
 * Check if user can edit visibility (only owner or educators in some cases)
 */
export function canChangeVisibility(
  isOwner: boolean,
  userRole?: string
): boolean {
  // Owner can always change
  if (isOwner) return true;

  // Educators might be able to change in institution context
  // (this would need more context-specific logic in real implementation)
  if (userRole && isEducatorRole(userRole)) {
    return false; // For now, only owner can change
  }

  return false;
}

/**
 * Get default visibility config based on context
 */
export function getDefaultVisibility(
  contextType?: ContextType,
  contextId?: string
): VisibilityConfig {
  // If in a context, default to GROUP with appropriate scope
  if (contextType && contextId) {
    let defaultScope: VisibilityScope;

    switch (contextType) {
      case ContextType.INSTITUTION:
        defaultScope = VisibilityScope.CLASS_PROJECT;
        break;
      case ContextType.GROUP_STUDY:
      case ContextType.FAMILY:
        defaultScope = VisibilityScope.GROUP_MEMBERS;
        break;
      default:
        defaultScope = VisibilityScope.GROUP_MEMBERS;
    }

    return {
      visibility: AnnotationVisibility.GROUP,
      scope: defaultScope,
      contextType,
      contextId,
    };
  }

  // Default to PRIVATE
  return {
    visibility: AnnotationVisibility.PRIVATE,
  };
}

/**
 * Hook to manage visibility state
 */
export function useVisibilityState(
  initialContext?: ContextInfo
) {
  const [visibility, setVisibility] = React.useState<AnnotationVisibility>(
    initialContext
      ? AnnotationVisibility.GROUP
      : AnnotationVisibility.PRIVATE
  );

  const [scope, setScope] = React.useState<VisibilityScope | undefined>(
    initialContext ? VisibilityScope.GROUP_MEMBERS : undefined
  );

  const [contextType, setContextType] = React.useState<ContextType | undefined>(
    initialContext?.type
  );

  const [contextId, setContextId] = React.useState<string | undefined>(
    initialContext?.id
  );

  const [learnerId, setLearnerId] = React.useState<string | undefined>();

  const config: VisibilityConfig = {
    visibility,
    scope,
    contextType,
    contextId,
    learnerId,
  };

  const validation = validateVisibilityConfig(config);
  const description = getVisibilityDescription(config);
  const availableScopes = useVisibilityScopes(contextType);

  return {
    visibility,
    setVisibility,
    scope,
    setScope,
    contextType,
    setContextType,
    contextId,
    setContextId,
    learnerId,
    setLearnerId,
    config,
    isValid: validation.valid,
    error: validation.error,
    description,
    availableScopes,
  };
}

import React from 'react';
