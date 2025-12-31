export declare const PUBLIC_ROUTES: readonly ["/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh", "/api/v1/auth/google", "/api/v1/auth/microsoft", "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password", "/api/v1/auth/extension/register", "/api/v1/auth/extension/login", "/api/v1/auth/extension/exchange"];
export declare function isPublicRoute(path: string): boolean;
export declare function getPublicRoutePrefixes(): string[];
