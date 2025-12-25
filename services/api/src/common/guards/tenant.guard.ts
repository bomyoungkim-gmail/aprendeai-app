/**
 * Tenant Guard
 *
 * Phase 0: Multi-Tenancy - RBAC
 * Prevents cross-tenant data access
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { getCurrentUser } from "../context/request-context";

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = getCurrentUser();

    if (!user) {
      // No user context - let AuthGuard handle it
      return true;
    }

    // Extract tenant from request (param, body, or query)
    const resourceTenantId =
      request.params?.institutionId ||
      request.body?.institutionId ||
      request.query?.institutionId;

    // If no explicit tenant in request, OK (middleware will filter)
    if (!resourceTenantId) {
      return true;
    }

    // Block cross-tenant access
    if (user.institutionId !== resourceTenantId) {
      this.logger.warn(
        `Cross-tenant access denied: user ${user.id} (institution ${user.institutionId}) ` +
          `attempted to access resource in institution ${resourceTenantId}`,
      );
      throw new ForbiddenException(
        "Access denied: cross-tenant access not allowed",
      );
    }

    return true;
  }
}
