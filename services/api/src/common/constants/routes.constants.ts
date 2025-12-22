/**
 * Centralized API Routes Configuration
 * 
 * Location: src/common/constants/routes.constants.ts
 * Purpose: Single source of truth for all API routes
 * 
 * DO NOT hardcode routes anywhere - import from here.
 * Used by: Controllers (for route decorators), Tests, Frontend API clients
 */

export const API_CONFIG = {
  PREFIX: 'api/v1',
  VERSION: 'v1',
} as const;

/**
 * Route definitions (without prefix)
 * Controllers use these directly: @Controller(ROUTES.AUTH.BASE)
 */
export const ROUTES = {
  // Auth routes
  AUTH: {
    BASE: 'auth',
    REGISTER: 'auth/register',
    LOGIN: 'auth/login',
    PROFILE: 'auth/profile',
    GOOGLE: 'auth/google',
    GOOGLE_CALLBACK: 'auth/google/callback',
    MICROSOFT: 'auth/microsoft',
    MICROSOFT_CALLBACK: 'auth/microsoft/callback',
  },
  
  // Family routes
  FAMILY: {
    BASE: 'families',
    BY_ID: (id: string) => `families/${id}`,
    INVITE: (id: string) => `families/${id}/invite`,
    TRANSFER_OWNERSHIP: (id: string) => `families/${id}/transfer-ownership`,
    SET_PRIMARY: (id: string) => `families/${id}/primary`,
    BILLING_HIERARCHY: (id: string) => `families/${id}/billing-hierarchy`,
  },
  
  // Content routes
  CONTENT: {
    BASE: 'contents',
    BY_ID: (id: string) => `contents/${id}`,
    CORNELL: (id: string) => `contents/${id}/cornell`,
    SESSIONS: (id: string) => `contents/${id}/sessions`,
  },
  
  // Session routes
  SESSION: {
    BASE: 'sessions',
    START: 'sessions/start',
    BY_ID: (id: string) => `sessions/${id}`,
    PROMPT: (id: string) => `sessions/${id}/prompt`,
    FINISH: (id: string) => `sessions/${id}/finish`,
    PRE: (id: string) => `sessions/${id}/pre`,
    EVENTS: (id: string) => `sessions/${id}/events`,
    ADVANCE: (id: string) => `sessions/${id}/advance`,
  },
  
  // Reading sessions (legacy)
  READING_SESSION: {
    BASE: 'reading-sessions',
    BY_ID: (id: string) => `reading-sessions/${id}`,
    PRE: (id: string) => `reading-sessions/${id}/pre`,
    EVENTS: (id: string) => `reading-sessions/${id}/events`,
    ADVANCE: (id: string) => `reading-sessions/${id}/advance`,
  },
} as const;

/**
 * Full URL builder with API prefix
 * For tests and external clients
 * 
 * @example
 * apiUrl('auth/login') => '/api/v1/auth/login'
 * apiUrl(ROUTES.AUTH.LOGIN) => '/api/v1/auth/login'
 */
export function apiUrl(route: string): string {
  // Remove leading slash if present
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  return `/${API_CONFIG.PREFIX}/${cleanRoute}`;
}

/**
 * Type-safe route builder (alias)
 * @deprecated Use apiUrl instead
 */
export const buildRoute = apiUrl;
