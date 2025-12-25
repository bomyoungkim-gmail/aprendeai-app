import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SetMetadata } from "@nestjs/common";

export const EXTENSION_SCOPES_KEY = "extension_scopes";

/**
 * Decorator to require specific extension scopes
 * Usage: @RequireExtensionScopes('extension:webclip:create')
 */
export const RequireExtensionScopes = (...scopes: string[]) =>
  SetMetadata(EXTENSION_SCOPES_KEY, scopes);

/**
 * Guard to validate extension scopes from JWT
 * Use with JwtAuthGuard: @UseGuards(JwtAuthGuard, ExtensionScopeGuard)
 */
@Injectable()
export class ExtensionScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      EXTENSION_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no scopes required, allow
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has scopes from JWT
    if (!user?.scopes) {
      // If user is authenticated but has NO scopes field, it's a malformed/incompatible token for this endpoint logic
      // misuse, or maybe strictly "Forbidden" is also okay, but Unauthorized fits "invalid credentials structure".
      // Let's stick to Forbidden for consistency usually? Or Unauthorized if token is "bad"?
      // User said: "forbidden é por que nao tem permissao"
      // If token is missing 'scopes', they definitely don't have permission.
      throw new ForbiddenException("Extension scopes required");
    }

    // Check if user has at least one of the required scopes
    const hasScope = requiredScopes.some((scope) =>
      (user.scopes as string[]).includes(scope),
    );

    if (!hasScope) {
      throw new ForbiddenException(
        `Missing required scope(s): ${requiredScopes.join(", ")}`,
      );
    }

    return true;
  }
}
