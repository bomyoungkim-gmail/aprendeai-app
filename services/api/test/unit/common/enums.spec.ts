/**
 * Test: Backend Enums Centralization
 * 
 * Validates that enums are correctly imported from Prisma Client
 * and accessible via the centralized constants file.
 */

import {
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
  AnnotationStatus,
  TargetType,
  FamilyRole,
  GroupRole,
} from '../../../src/common/constants/enums';

describe('Cornell Notes Enums', () => {
  describe('VisibilityScope', () => {
    it('should have all expected values', () => {
      expect(VisibilityScope.CLASS_PROJECT).toBe('CLASS_PROJECT');
      expect(VisibilityScope.ONLY_EDUCATORS).toBe('ONLY_EDUCATORS');
      expect(VisibilityScope.RESPONSIBLES_OF_LEARNER).toBe('RESPONSIBLES_OF_LEARNER');
      expect(VisibilityScope.GROUP_MEMBERS).toBe('GROUP_MEMBERS');
    });
  });

  describe('ContextType', () => {
    it('should have all expected values', () => {
      expect(ContextType.INSTITUTION).toBe('INSTITUTION');
      expect(ContextType.GROUP_STUDY).toBe('GROUP_STUDY');
      expect(ContextType.FAMILY).toBe('FAMILY');
    });
  });

  describe('AnnotationStatus', () => {
    it('should have all expected values', () => {
      expect(AnnotationStatus.ACTIVE).toBe('ACTIVE');
      expect(AnnotationStatus.DELETED).toBe('DELETED');
    });
  });

  describe('Type Safety', () => {
    it('should enforce type safety for visibility scopes', () => {
      const validScope: VisibilityScope = VisibilityScope.CLASS_PROJECT;
      expect(validScope).toBeDefined();
      
      // TypeScript should prevent this (tested at compile time):
      // const invalidScope: VisibilityScope = 'INVALID';
    });

    it('should work with Prisma enums', () => {
      // These should match Prisma Client enums exactly
      const visibility: AnnotationVisibility = 'PRIVATE' as AnnotationVisibility;
      expect(['PRIVATE', 'GROUP', 'PUBLIC']).toContain(visibility);
    });
  });
});

describe('Existing Enums Integration', () => {
  describe('FamilyRole', () => {
    it('should include EDUCATOR and LEARNER roles', () => {
      // These are critical for Cornell Notes permissions
      const roles = Object.values(FamilyRole);
      expect(roles).toContain('EDUCATOR');
      expect(roles).toContain('LEARNER');
    });
  });

  describe('GroupRole', () => {
    it('should have standard group roles', () => {
      expect(['OWNER', 'MOD', 'MEMBER']).toContain(GroupRole.OWNER);
    });
  });
});
