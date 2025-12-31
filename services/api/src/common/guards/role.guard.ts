import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ContextRole } from "@prisma/client";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<ContextRole[]>(
      "roles",
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check contextRole
    if (!user || !user.contextRole) {
      throw new ForbiddenException("Access denied: Context Role required");
    }

    if (!roles.includes(user.contextRole)) {
      throw new ForbiddenException(
        "Access denied: Insufficient Context privileges",
      );
    }

    return true;
  }
}
