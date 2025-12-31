import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SystemRole, ContextRole } from "@prisma/client";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (SystemRole | ContextRole | string)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // Check systemRole OR contextRole (dual-role system)
    const hasAccess =
      this.hasSystemRole(user, requiredRoles) ||
      this.hasContextRole(user, requiredRoles);

    if (!hasAccess) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  /**
   * Check if user has required systemRole
   */
  private hasSystemRole(
    user: any,
    requiredRoles: (SystemRole | ContextRole | string)[],
  ): boolean {
    return user.systemRole && requiredRoles.includes(user.systemRole);
  }

  /**
   * Check if user has required contextRole
   */
  private hasContextRole(
    user: any,
    requiredRoles: (SystemRole | ContextRole | string)[],
  ): boolean {
    return user.contextRole && requiredRoles.includes(user.contextRole);
  }
}
