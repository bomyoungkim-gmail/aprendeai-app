import { UserRole, SystemRole, ContextRole } from '@prisma/client';
import { mapUserRoleToContextRoles } from '../scripts/backfill-context-roles';

describe('Subfase 2.2: Context Roles Mapping Logic', () => {
  describe('mapUserRoleToContextRoles', () => {
    test('should map ADMIN to systemRole ADMIN and contextRole OWNER', () => {
      const result = mapUserRoleToContextRoles(UserRole.ADMIN);
      expect(result).toEqual({
        systemRole: SystemRole.ADMIN,
        contextRole: ContextRole.OWNER,
      });
    });

    test('should map SUPPORT to systemRole SUPPORT and contextRole OWNER', () => {
      const result = mapUserRoleToContextRoles(UserRole.SUPPORT);
      expect(result).toEqual({
        systemRole: SystemRole.SUPPORT,
        contextRole: ContextRole.OWNER,
      });
    });

    test('should map OPS to systemRole OPS and contextRole OWNER', () => {
      const result = mapUserRoleToContextRoles(UserRole.OPS);
      expect(result).toEqual({
        systemRole: SystemRole.OPS,
        contextRole: ContextRole.OWNER,
      });
    });

    test('should map INSTITUTION_ADMIN to null systemRole and contextRole INSTITUTION_EDUCATION_ADMIN', () => {
      const result = mapUserRoleToContextRoles(UserRole.INSTITUTION_ADMIN);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.INSTITUTION_EDUCATION_ADMIN,
      });
    });

    test('should map SCHOOL_ADMIN to null systemRole and contextRole INSTITUTION_EDUCATION_ADMIN', () => {
      const result = mapUserRoleToContextRoles(UserRole.SCHOOL_ADMIN);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.INSTITUTION_EDUCATION_ADMIN,
      });
    });

    test('should map TEACHER to null systemRole and contextRole TEACHER', () => {
      const result = mapUserRoleToContextRoles(UserRole.TEACHER);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.TEACHER,
      });
    });

    test('should map STUDENT to null systemRole and contextRole STUDENT', () => {
      const result = mapUserRoleToContextRoles(UserRole.STUDENT);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.STUDENT,
      });
    });

    test('should map GUARDIAN to null systemRole and contextRole OWNER', () => {
      const result = mapUserRoleToContextRoles(UserRole.GUARDIAN);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.OWNER,
      });
    });

    test('should map COMMON_USER to null systemRole and contextRole OWNER', () => {
      const result = mapUserRoleToContextRoles(UserRole.COMMON_USER);
      expect(result).toEqual({
        systemRole: null,
        contextRole: ContextRole.OWNER,
      });
    });

    test('should handle all UserRole enum values', () => {
      const allRoles = Object.values(UserRole);
      
      // Verify every role has a mapping
      allRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result).toBeDefined();
        expect(result.contextRole).toBeDefined();
      });
    });

    test('should only assign systemRole to system users (ADMIN, SUPPORT, OPS)', () => {
      const systemRoles = [UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS];
      const nonSystemRoles = Object.values(UserRole).filter(
        role => !systemRoles.includes(role)
      );

      // System users should have systemRole
      systemRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result.systemRole).not.toBeNull();
      });

      // Non-system users should NOT have systemRole
      nonSystemRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result.systemRole).toBeNull();
      });
    });

    test('should always assign a contextRole (never null)', () => {
      const allRoles = Object.values(UserRole);
      
      allRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result.contextRole).toBeDefined();
        expect(result.contextRole).not.toBeNull();
      });
    });
  });

  describe('Role Mapping Consistency', () => {
    test('should be deterministic (same input = same output)', () => {
      const testRole = UserRole.TEACHER;
      const result1 = mapUserRoleToContextRoles(testRole);
      const result2 = mapUserRoleToContextRoles(testRole);
      
      expect(result1).toEqual(result2);
    });

    test('should map institutional roles correctly', () => {
      const institutionalRoles = [
        UserRole.INSTITUTION_ADMIN,
        UserRole.SCHOOL_ADMIN,
        UserRole.TEACHER,
        UserRole.STUDENT,
      ];

      institutionalRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        // All institutional roles should have null systemRole
        expect(result.systemRole).toBeNull();
        // All should have a non-OWNER contextRole
        expect(result.contextRole).not.toBe(ContextRole.OWNER);
      });
    });

    test('should map non-institutional users to OWNER contextRole', () => {
      const nonInstitutionalRoles = [
        UserRole.GUARDIAN,
        UserRole.COMMON_USER,
      ];

      nonInstitutionalRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result.contextRole).toBe(ContextRole.OWNER);
      });
    });

    test('should map system admins to OWNER contextRole', () => {
      const systemAdmins = [UserRole.ADMIN, UserRole.SUPPORT, UserRole.OPS];

      systemAdmins.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(result.contextRole).toBe(ContextRole.OWNER);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle unexpected role gracefully (default to OWNER)', () => {
      // TypeScript should prevent this, but test runtime behavior
      const unknownRole = 'UNKNOWN_ROLE' as UserRole;
      const result = mapUserRoleToContextRoles(unknownRole);
      
      expect(result.systemRole).toBeNull();
      expect(result.contextRole).toBe(ContextRole.OWNER);
    });

    test('should produce valid ContextRole values', () => {
      const validContextRoles = Object.values(ContextRole);
      const allRoles = Object.values(UserRole);

      allRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        expect(validContextRoles).toContain(result.contextRole);
      });
    });

    test('should produce valid SystemRole values when not null', () => {
      const validSystemRoles = Object.values(SystemRole);
      const allRoles = Object.values(UserRole);

      allRoles.forEach(role => {
        const result = mapUserRoleToContextRoles(role);
        if (result.systemRole !== null) {
          expect(validSystemRoles).toContain(result.systemRole);
        }
      });
    });
  });
});
