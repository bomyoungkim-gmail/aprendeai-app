/**
 * Centralized Enums - Backend
 *
 * Re-exports enums from Prisma Client for type-safe usage.
 * DO NOT use hard-coded strings - always import from here or directly from @prisma/client.
 *
 * @module common/constants/enums
 */

// Import enum VALUES from Prisma Client (runtime enums)
import {
  AnnotationVisibility,
  ContentType,
  FamilyRole,
  GroupRole,
  GroupMemberStatus,
  FamilyMemberStatus,
} from "@prisma/client";

// Re-export for easy importing throughout the application
export {
  AnnotationVisibility,
  ContentType,
  FamilyRole,
  GroupRole,
  GroupMemberStatus,
  FamilyMemberStatus,
};

// ========================================
// NEW ENUMS (will be available from Prisma after migration)
// ========================================

/**
 * Granular visibility scopes for annotations
 * Will be added to schema.prisma
 */
export enum VisibilityScope {
  CLASS_PROJECT = "CLASS_PROJECT",
  ONLY_EDUCATORS = "ONLY_EDUCATORS",
  RESPONSIBLES_OF_LEARNER = "RESPONSIBLES_OF_LEARNER",
  GROUP_MEMBERS = "GROUP_MEMBERS",
}

/**
 * Type of sharing context
 * Will be added to schema.prisma
 */
export enum ContextType {
  INSTITUTION = "INSTITUTION",
  GROUP_STUDY = "GROUP_STUDY",
  FAMILY = "FAMILY",
}

/**
 * Annotation status (for soft delete)
 * Will be added to schema.prisma
 */
export enum AnnotationStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

// ========================================
// CONSTANTS
// ========================================

/**
 * After migration is applied, import these from @prisma/client instead:
 *
 * import { VisibilityScope, ContextType, AnnotationStatus } from '@prisma/client';
 * export { VisibilityScope, ContextType, AnnotationStatus };
 */
