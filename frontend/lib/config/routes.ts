/**
 * Centralized Frontend Route Configuration
 * 
 * Single source of truth for all frontend navigation routes.
 * Update here when changing URL structure.
 * 
 * Pattern: Same as API_ENDPOINTS but for frontend navigation
 */

/**
 * Root routes
 */
export const ROUTES = {
  HOME: '/',
  
  // Auth
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    CALLBACK: '/auth/callback',
  },
  
  // Dashboard
  DASHBOARD: {
    HOME: '/dashboard',
    LIBRARY: {
      HOME: '/dashboard/library',
      DETAIL: (id: string) => `/dashboard/library/${id}`,
    },
    PROGRESS: '/dashboard/progress',
  },
  
  // Settings
  SETTINGS: {
    HOME: '/settings',
    ACCOUNT: '/settings/account',
    BILLING: '/settings/billing',
    FAMILY: {
      HOME: '/settings/family',
      DETAIL: (id: string) => `/settings/family/${id}`,
    },
  },
  
  // Family (shortcuts for cleaner usage)
  FAMILY: {
    HOME: '/settings/family',
    DETAIL: (id: string) => `/settings/family/${id}`,
  },
  
  // Study Groups
  GROUPS: {
    HOME: '/groups',
    DETAIL: (groupId: string) => `/groups/${groupId}`,
    SESSION: (groupId: string, sessionId: string) => `/groups/${groupId}/sessions/${sessionId}`,
  },
  
  // Content Reading
  READER: (contentId: string) => `/reader/${contentId}`,
  
  // Review
  REVIEW: {
    HOME: '/review',
    QUEUE: '/review/queue',
  },
  
  // Admin
  ADMIN: {
    HOME: '/admin',
    USERS: '/admin/users',
    FEATURE_FLAGS: '/admin/feature-flags',
    SECRETS: '/admin/secrets',
    AUDIT: '/admin/audit',
    OBSERVABILITY: '/admin/observability',
    SETTINGS: '/admin/settings',
  },
  
  // Marketing/Public
  PRICING: '/pricing',
  SIGNUP: '/signup',
  
  // External
  EXTERNAL: {
    SUPPORT_EMAIL: 'mailto:support@aprendeai.com',
    SALES_EMAIL: 'mailto:sales@aprendeai.com',
  },
} as const;

/**
 * Route helpers with query params
 */
export const ROUTES_WITH_PARAMS = {
  LOGIN_WITH_ERROR: (error: string) => `/login?error=${error}`,
  GROUPS_WITH_ERROR: (error: string) => `/groups?error=${error}`,
  GROUP_WITH_ERROR: (groupId: string, error: string) => `/groups/${groupId}?error=${error}`,
} as const;

/**
 * Common error codes for routes
 */
export const ROUTE_ERRORS = {
  OAUTH_FAILED: 'oauth_failed',
  INVALID_CALLBACK: 'invalid_callback',
  SESSION_NOT_FOUND: 'session_not_found',
  SESSION_FORBIDDEN: 'session_forbidden',
  NOT_MEMBER: 'not_member',
  NOT_FOUND: 'not_found',
} as const;

/**
 * Type helper for route paths
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES] | string;
