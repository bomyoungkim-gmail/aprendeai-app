import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // NEW: Check systemRole OR contextRole (if present), else fall back to legacy role
    const hasAccess =
      this.hasSystemRole(user, requiredRoles) ||
      this.hasContextRole(user, requiredRoles) ||
      this.hasLegacyRole(user, requiredRoles);

    if (!hasAccess) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  /**
   * Check if user has required systemRole
   */
  private hasSystemRole(user: any, requiredRoles: UserRole[]): boolean {
    return user.systemRole && requiredRoles.includes(user.systemRole);
  }

  /**
   * Check if user has required contextRole
   */
  private hasContextRole(user: any, requiredRoles: UserRole[]): boolean {
    return user.contextRole && requiredRoles.includes(user.contextRole);
  }

  /**
   * Check legacy single role field (backward compatibility)
   */
  private hasLegacyRole(user: any, requiredRoles: UserRole[]): boolean {
    return user.role && requiredRoles.includes(user.role);
  }
}
