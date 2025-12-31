/**
 * Centralized registry of public routes that don't require authentication
 *
 * This ensures consistency between guards, middleware, and documentation.
 * All routes listed here will bypass JwtAuthGuard when using @Public() decorator.
 */

/**
 * Public routes that should be accessible without authentication
 */
export const PUBLIC_ROUTES = [
  // Health & Status
  "/api/v1/health",

  // Authentication
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/google",
  "/api/v1/auth/microsoft",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",

  // Extension Auth (for browser extension)
  "/api/v1/auth/extension/register",
  "/api/v1/auth/extension/login",
  "/api/v1/auth/extension/exchange",
] as const;

/**
 * Helper function to check if a path is public
 * @param path - The request path to check
 * @returns true if the path is public, false otherwise
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Helper to get all public route prefixes (for middleware exclusion)
 */
export function getPublicRoutePrefixes(): string[] {
  return [...PUBLIC_ROUTES];
}
