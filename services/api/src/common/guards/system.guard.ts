import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SystemRole } from "@prisma/client";

@Injectable()
export class SystemGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<SystemRole[]>(
      "systemRoles",
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has systemRole
    if (!user || !user.systemRole) {
      throw new ForbiddenException("Access denied: System Role required");
    }

    if (!roles.includes(user.systemRole)) {
      throw new ForbiddenException(
        "Access denied: Insufficient System privileges",
      );
    }

    return true;
  }
}
