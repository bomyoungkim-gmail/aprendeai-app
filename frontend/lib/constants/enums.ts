/**
 * Centralized Enums - Frontend
 * 
 * These enums MUST match the Prisma schema enums exactly.
 * DO NOT use hard-coded strings - always import from here.
 * 
 * TODO: [FUTURE IMPROVEMENTS]
 * 1. Add CI/CD validation script to compare frontend enums with Prisma schema
 *    - Script should fail build if enums diverge
 *    - Run on pre-commit and in CI pipeline
 * 2. Auto-generate frontend enums from Prisma using prisma-generator
 *    - Install: prisma-generator-typescript-enums or similar
 *    - Single source of truth in schema.prisma
 *    - Eliminates manual sync errors
 * 3. Consolidate TargetType into ContentType in database
 *    - See: tech-debt-enum-unification.md for migration plan
 *    - Remove redundant TargetType enum from Prisma
 *    - Update highlights table to use ContentType
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
  NEWS = 'NEWS',
  ARXIV = 'ARXIV',
  SCHOOL_MATERIAL = 'SCHOOL_MATERIAL',
  WEB_CLIP = 'WEB_CLIP',
}

/**
 * Target types for highlights/annotations
 * Now unified with ContentType for frontend compatibility.
 * 
 * TODO: [TECH DEBT] Unify TargetType and ContentType in database schema
 * Currently, TargetType exists as a separate enum in Prisma schema for historical reasons.
 * Ideally, we should:
 * 1. Create migration to change highlights.target_type column from TargetType to ContentType
 * 2. Remove TargetType enum from schema.prisma entirely
 * 3. Use ContentType everywhere (single source of truth)
 * Risk: Migration requires updating existing highlight records and careful testing
 * Benefit: Eliminates redundant enum and simplifies type system across entire stack
 */
export type TargetType = ContentType;
export const TargetType = ContentType;

/**
 * Family member roles (hierarchical/ownership)
 * Maps to: FamilyRole in schema.prisma
 */
export enum FamilyRole {
  OWNER = 'OWNER',
  GUARDIAN = 'GUARDIAN',
  CHILD = 'CHILD',
}

/**
 * Learning roles within family context (pedagogical)
 * Maps to: FamilyLearningRole in schema.prisma
 * This is an optional field in family_members table
 */
export enum FamilyLearningRole {
  EDUCATOR = 'EDUCATOR',
  LEARNER = 'LEARNER',
  PEER = 'PEER',
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
 * Check if a learning role is an educator
 */
export function isEducatorRole(role: string): boolean {
  return role === FamilyLearningRole.EDUCATOR || role === 'EDUCATOR';
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
  [AnnotationVisibility.PRIVATE]: 'Privado',
  [AnnotationVisibility.GROUP]: 'Grupo',
  [AnnotationVisibility.PUBLIC]: 'Público',
};

// Cornell Type Labels (for UI)
export const CORNELL_TYPE_LABELS: Record<string, string> = {
  NOTE: 'Nota',
  QUESTION: 'Questão',
  STAR: 'Importante',
  HIGHLIGHT: 'Destaque',
  SUMMARY: 'Resumo',
  AI_RESPONSE: 'Resposta IA',
};

