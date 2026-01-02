/**
 * Test: Frontend Enums and Helpers
 * 
 * Validates enum values, helper functions, and type safety
 * for Cornell Notes constants.
 */

import {
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
  AnnotationStatus,
  TargetType,
  FamilyRole,
  FamilyLearningRole,
  isEducatorRole,
  canEditAnnotation,
  getAvailableScopes,
  VISIBILITY_SCOPE_LABELS,
  CONTEXT_TYPE_LABELS,
  ANNOTATION_VISIBILITY_LABELS,
} from '@/lib/constants/enums';

describe('Cornell Notes Enums', () => {
  describe('VisibilityScope', () => {
    it('should have all expected enum values', () => {
      expect(VisibilityScope.CLASS_PROJECT).toBe('CLASS_PROJECT');
      expect(VisibilityScope.ONLY_EDUCATORS).toBe('ONLY_EDUCATORS');
      expect(VisibilityScope.RESPONSIBLES_OF_LEARNER).toBe('RESPONSIBLES_OF_LEARNER');
      expect(VisibilityScope.GROUP_MEMBERS).toBe('GROUP_MEMBERS');
    });

    it('should have Portuguese labels', () => {
      expect(VISIBILITY_SCOPE_LABELS[VisibilityScope.CLASS_PROJECT]).toBe('Projeto de Classe');
      expect(VISIBILITY_SCOPE_LABELS[VisibilityScope.ONLY_EDUCATORS]).toBe('Apenas Educadores');
    });
  });

  describe('ContextType', () => {
    it('should have all expected values', () => {
      expect(ContextType.INSTITUTION).toBe('INSTITUTION');
      expect(ContextType.GROUP_STUDY).toBe('GROUP_STUDY');
      expect(ContextType.FAMILY).toBe('FAMILY');
    });

    it('should have Portuguese labels', () => {
      expect(CONTEXT_TYPE_LABELS[ContextType.INSTITUTION]).toBe('Instituição');
      expect(CONTEXT_TYPE_LABELS[ContextType.GROUP_STUDY]).toBe('Grupo de Estudo');
      expect(CONTEXT_TYPE_LABELS[ContextType.FAMILY]).toBe('Família');
    });
  });

  describe('TargetType', () => {
    it('should include VIDEO and AUDIO for timestamps', () => {
      expect(TargetType.VIDEO).toBe('VIDEO');
      expect(TargetType.AUDIO).toBe('AUDIO');
      expect(TargetType.PDF).toBe('PDF');
      expect(TargetType.IMAGE).toBe('IMAGE');
    });
  });
});

describe('Helper Functions', () => {
  describe('isEducatorRole', () => {
    it('should identify EDUCATOR role', () => {
      expect(isEducatorRole(FamilyLearningRole.EDUCATOR)).toBe(true);
      expect(isEducatorRole('EDUCATOR')).toBe(true);
    });

    it('should return false for non-educator roles', () => {
      expect(isEducatorRole(FamilyLearningRole.LEARNER)).toBe(false);
      expect(isEducatorRole(FamilyRole.GUARDIAN)).toBe(false);
    });
  });

  describe('canEditAnnotation', () => {
    const userId = 'user-123';
    const annotationOwnerId = 'owner-456';

    it('should allow owner to edit', () => {
      expect(canEditAnnotation(userId, userId)).toBe(true);
    });

    it('should deny non-owner', () => {
      expect(canEditAnnotation(annotationOwnerId, userId)).toBe(false);
    });
  });

  describe('getAvailableScopes', () => {
    it('should return institution scopes', () => {
      const scopes = getAvailableScopes(ContextType.INSTITUTION);
      expect(scopes).toContain(VisibilityScope.CLASS_PROJECT);
      expect(scopes).toContain(VisibilityScope.ONLY_EDUCATORS);
      expect(scopes).toContain(VisibilityScope.RESPONSIBLES_OF_LEARNER);
    });

    it('should return group members for groups', () => {
      const scopes = getAvailableScopes(ContextType.GROUP_STUDY);
      expect(scopes).toEqual([VisibilityScope.GROUP_MEMBERS]);
    });

    it('should return group members for families', () => {
      const scopes = getAvailableScopes(ContextType.FAMILY);
      expect(scopes).toEqual([VisibilityScope.GROUP_MEMBERS]);
    });
  });
});

describe('Type Safety', () => {
  it('should enforce type safety at compile time', () => {
    // This compiles successfully:
    const validVisibility: AnnotationVisibility = AnnotationVisibility.PRIVATE;
    expect(validVisibility).toBeDefined();

    // This would fail at compile time:
    // const invalid: AnnotationVisibility = 'INVALID';
  });
});
