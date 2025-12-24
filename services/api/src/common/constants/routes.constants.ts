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
    
    // Extension Device Code (Browser Extension)
    EXTENSION_DEVICE_START: 'auth/extension/device/start',
    EXTENSION_DEVICE_POLL: 'auth/extension/device/poll',
    EXTENSION_DEVICE_APPROVE: 'auth/extension/device/approve',
    EXTENSION_TOKEN_REFRESH: 'auth/extension/token/refresh',
    EXTENSION_GRANTS_REVOKE: (grantId: string) => `auth/extension/grants/${grantId}/revoke`,
    EXTENSION_ME: 'auth/extension/me',
  },
  
  // Family routes
  FAMILY: {
    BASE: 'families',
    BY_ID: (id: string) => `families/${id}`,
    INVITE: (id: string) => `families/${id}/invite`,
    ACCEPT: (id: string) => `families/${id}/accept`,
    USAGE: (id: string) => `families/${id}/usage`,
    REMOVE_MEMBER: (id: string, memberUserId: string) => `families/${id}/members/${memberUserId}`,
    TRANSFER_OWNERSHIP: (id: string) => `families/${id}/transfer-ownership`,
    SET_PRIMARY: (id: string) => `families/${id}/primary`,
    BILLING_HIERARCHY: (id: string) => `families/${id}/billing-hierarchy`,
    
    // Family Mode (Policy)
    POLICY_CREATE: 'families/policy',
    POLICY_GET: (familyId: string, learnerId: string) => `families/policy/${familyId}/${learnerId}`,
    POLICY_PROMPT: (policyId: string) => `families/policy/${policyId}/prompt`,
    
    // Family Mode (Dashboard)
    EDUCATOR_DASHBOARD: (familyId: string, learnerId: string) => `families/${familyId}/educator-dashboard/${learnerId}`,
    
    // Family Mode (Co-Reading Sessions)
    CO_SESSION_START: 'families/co-sessions/start',
    CO_SESSION_BY_ID: (id: string) => `families/co-sessions/${id}`,
    CO_SESSION_PROMPT: (id: string) => `families/co-sessions/${id}/prompt`,
    CO_SESSION_FINISH: (id: string) => `families/co-sessions/${id}/finish`,
    
    // Family Mode (Teach-Back)
    TEACHBACK_START: 'families/teachback/start',
    TEACHBACK_PROMPT: (id: string) => `families/teachback/${id}/prompt`,
    TEACHBACK_FINISH: (id: string) => `families/teachback/${id}/finish`,
    
    // Family Mode (Reports)
    REPORTS_WEEKLY: 'families/reports/weekly',
    REPORTS_WEEKLY_PROMPT: 'families/reports/weekly/prompt',
  },
  
  // Study Group routes
  GROUPS: {
    BASE: 'study-groups',
    BY_ID: (id: string) => `study-groups/${id}`,
    JOIN: (id: string) => `study-groups/${id}/join`,
    LEAVE: (id: string) => `study-groups/${id}/leave`,
  },
  
  // Classroom routes
  CLASSROOM: {
    BASE: 'classrooms',
    CREATE: 'classrooms',
    BY_ID: (id: string) => `classrooms/${id}`,
    UPDATE: (id: string) => `classrooms/${id}`,
    DELETE: (id: string) => `classrooms/${id}`,
    
    // Enrollment
    ENROLL: (id: string) => `classrooms/${id}/enroll`,
    ENROLLMENTS: (id: string) => `classrooms/${id}/enrollments`,
    
    // Policy
    POLICY_UPSERT: (id: string) => `classrooms/${id}/policy`,
    POLICY_GET: (id: string) => `classrooms/${id}/policy`,
    POLICY_PROMPT: (id: string) => `classrooms/${id}/policy/prompt`,
    
    // Weekly Plans
    PLAN_CREATE: (id: string) => `classrooms/${id}/plans/weekly`,
    PLAN_CURRENT: (id: string) => `classrooms/${id}/plans/weekly`,
    PLAN_PROMPT: (id: string) => `classrooms/${id}/plans/weekly/prompt`,
    
    // Dashboard
    DASHBOARD: (id: string) => `classrooms/${id}/dashboard`,
    DASHBOARD_PROMPT: (id: string) => `classrooms/${id}/dashboard/prompt`,
    
    // Interventions
    INTERVENTIONS_LOG: (id: string) => `classrooms/${id}/interventions`,
    INTERVENTIONS_PROMPT: (id: string) => `classrooms/${id}/interventions/prompt`,
    
    // Reports
    REPORTS_WEEKLY: (id: string) => `classrooms/${id}/reports/weekly`,
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
  
  // OpsCoach routes
  OPS: {
    BASE: 'ops',
    DAILY_SNAPSHOT: 'ops/daily-snapshot',
    WHAT_NEXT: 'ops/what-next',
    CONTEXT_CARDS: 'ops/context-cards',
    LOG_TIME: 'ops/log',
    BOOT_PROMPT: 'ops/boot',
    CLOSE_PROMPT: 'ops/close',
  },
  
  // Institution routes
  INSTITUTIONS: {
    BASE: 'institutions',
    BY_ID: (id: string) => `institutions/${id}`,
    CREATE: 'institutions',
    UPDATE: (id: string) => `institutions/${id}`,
    DELETE: (id: string) => `institutions/${id}`,
    
    // Invites
    INVITES: (id: string) => `institutions/${id}/invites`,
    CREATE_INVITE: (id: string) => `institutions/${id}/invites`,
    CANCEL_INVITE: (id: string, inviteId: string) => `institutions/${id}/invites/${inviteId}`,
    
    // Domains
    DOMAINS: (id: string) => `institutions/${id}/domains`,
    ADD_DOMAIN: (id: string) => `institutions/${id}/domains`,
    REMOVE_DOMAIN: (id: string, domainId: string) => `institutions/${id}/domains/${domainId}`,
    
    // Approvals
    PENDING: (id: string) => `institutions/${id}/pending`,
    PROCESS_APPROVAL: (id: string, approvalId: string) => `institutions/${id}/pending/${approvalId}`,
  },
  
  // WebClip routes (Browser Extension)
  WEBCLIP: {
    BASE: 'webclips',
    CREATE: 'webclips',
    START_SESSION: (contentId: string) => `webclips/${contentId}/sessions/start`,
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
