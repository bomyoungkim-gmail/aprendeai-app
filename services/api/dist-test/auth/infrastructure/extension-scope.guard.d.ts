import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
export declare const EXTENSION_SCOPES_KEY = "extension_scopes";
export declare const RequireExtensionScopes: (...scopes: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class ExtensionScopeGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
