import { useAuthStore } from '@/stores/auth-store';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'USER';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (requiredRole: Role | Role[]): boolean => {
    if (!user) return false;

    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check System Role (Global)
    if (user.systemRole && rolesToCheck.includes(user.systemRole as Role)) {
      return true;
    }

    // Check Context Role (Institution specific)
    if (user.contextRole && rolesToCheck.includes(user.contextRole as Role)) {
      return true;
    }

    return false;
  };

  /**
   * Check if user is a System Admin
   */
  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  /**
   * Check if user is a Teacher (in current context)
   */
  const isTeacher = (): boolean => {
    return hasRole('TEACHER');
  };

  return {
    user,
    hasRole,
    isAdmin,
    isTeacher,
  };
}
