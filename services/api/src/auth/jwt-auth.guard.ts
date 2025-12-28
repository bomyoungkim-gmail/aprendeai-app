import { Injectable, ExecutionContext, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    if (isPublic) {
      this.logger.log(`[PUBLIC] Bypassing auth for: ${route}`);
      return true; // Allow access without authentication
    }

    this.logger.debug(`[PROTECTED] Validating auth for: ${route}`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    if (err || !user) {
      const errorMsg = info?.message || err?.message || 'Unknown auth error';
      this.logger.warn(`[AUTH_FAILED] ${route} - Reason: ${errorMsg}`);
      throw err || new UnauthorizedException(errorMsg);
    }

    this.logger.debug(`[AUTH_SUCCESS] ${route} - User: ${user.email}`);
    return user;
  }
}
