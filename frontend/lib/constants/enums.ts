/**
 * Centralized Enums - Frontend
 * 
 * These enums MUST match the Prisma schema enums exactly.
 * DO NOT use hard-coded strings - always import from here.
 * 
 * @module lib/constants/enums
 */

// ========================================
// EXISTING ENUMS (from schema.prisma)
// ========================================

/**
 * Annotation visibility levels
 * Maps to: AnnotationVisibility in schema.prisma
 */
export enum AnnotationVisibility {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  PUBLIC = 'PUBLIC',
}

/**
 * Content types supported
 * Maps to: ContentType in schema.prisma
 */
export enum ContentType {
  TEXT = 'TEXT',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  ARTICLE = 'ARTICLE',
  DOCX = 'DOCX',
}

/**
 * Target types for highlights/annotations
 * Maps to: TargetType in schema.prisma
 * Note: Will be extended to include VIDEO and AUDIO
 */
export enum TargetType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  DOCX = 'DOCX',
  VIDEO = 'VIDEO',  // To be added in migration
  AUDIO = 'AUDIO',  // To be added in migration
}

/**
 * Family member roles
 * Maps to: FamilyRole in schema.prisma
 */
export enum FamilyRole {
  OWNER = 'OWNER',
  GUARDIAN = 'GUARDIAN',
  CHILD = 'CHILD',
  EDUCATOR = 'EDUCATOR',
  LEARNER = 'LEARNER',
}

/**
 * Study group member roles
 * Maps to: GroupRole in schema.prisma
 */
export enum GroupRole {
  OWNER = 'OWNER',
  MOD = 'MOD',
  MEMBER = 'MEMBER',
}

/**
 * Group member status
 * Maps to: GroupMemberStatus in schema.prisma
 */
export enum GroupMemberStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  REMOVED = 'REMOVED',
}

// ========================================
// NEW ENUMS (to be added in migration)
// ========================================

/**
 * Granular visibility scopes for annotations
 * Determines WHO can see an annotation within a context
 */
export enum VisibilityScope {
  /** Institution: Educators + Students */
  CLASS_PROJECT = 'CLASS_PROJECT',
  /** Institution: Only educators */
  ONLY_EDUCATORS = 'ONLY_EDUCATORS',
  /** Institution/Family: Guardians of specific learner */
  RESPONSIBLES_OF_LEARNER = 'RESPONSIBLES_OF_LEARNER',
  /** Group/Family: All active members */
  GROUP_MEMBERS = 'GROUP_MEMBERS',
}

/**
 * Type of sharing context
 */
export enum ContextType {
  INSTITUTION = 'INSTITUTION',
  GROUP_STUDY = 'GROUP_STUDY',
  FAMILY = 'FAMILY',
}

/**
 * Annotation status (for soft delete)
 */
export enum AnnotationStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if a user role is an educator
 */
export function isEducatorRole(role: string): boolean {
  return role === FamilyRole.EDUCATOR || role === 'EDUCATOR';
}

/**
 * Check if a user can edit an annotation
 * Only the owner can edit the annotation itself
 */
export function canEditAnnotation(annotationOwnerId: string, userId: string): boolean {
  return annotationOwnerId === userId;
}

/**
 * Get available scopes for a given context type
 */
export function getAvailableScopes(contextType: ContextType): VisibilityScope[] {
  switch (contextType) {
    case ContextType.INSTITUTION:
      return [
        VisibilityScope.CLASS_PROJECT,
        VisibilityScope.ONLY_EDUCATORS,
        VisibilityScope.RESPONSIBLES_OF_LEARNER,
      ];
    case ContextType.GROUP_STUDY:
    case ContextType.FAMILY:
      return [VisibilityScope.GROUP_MEMBERS];
    default:
      return [];
  }
}

/**
 * Human-readable labels for visibility scopes
 */
export const VISIBILITY_SCOPE_LABELS: Record<VisibilityScope, string> = {
  [VisibilityScope.CLASS_PROJECT]: 'Projeto de Classe',
  [VisibilityScope.ONLY_EDUCATORS]: 'Apenas Educadores',
  [VisibilityScope.RESPONSIBLES_OF_LEARNER]: 'Responsáveis do Aluno',
  [VisibilityScope.GROUP_MEMBERS]: 'Membros do Grupo',
};

/**
 * Human-readable labels for context types
 */
export const CONTEXT_TYPE_LABELS: Record<ContextType, string> = {
  [ContextType.INSTITUTION]: 'Instituição',
  [ContextType.GROUP_STUDY]: 'Grupo de Estudo',
  [ContextType.FAMILY]: 'Família',
};

/**
 * Human-readable labels for annotation visibility
 */
export const ANNOTATION_VISIBILITY_LABELS: Record<AnnotationVisibility, string> = {
  [AnnotationVisibility.PRIVATE]: '🔒 Privado',
  [AnnotationVisibility.GROUP]: '👥 Compartilhado',
  [AnnotationVisibility.PUBLIC]: '🌐 Público',
};
