/**
 * Centralized API Configuration
 * 
 * Single source of truth for all backend API URLs and endpoints.
 * Update here when changing ports, prefixes, or deployment URLs.
 */

/**
 * Base API URL - includes version prefix
 * Falls back to local development if env var not set
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * WebSocket URL - uses same base as REST API
 */
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    GOOGLE: '/auth/google',
    MICROSOFT: '/auth/microsoft',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Health
  HEALTH: '/health',
  
  // Users
  USERS: {
    ME: '/users/me',
    AVATAR: '/users/me/avatar',
    STATS: '/users/me/stats',
    ACTIVITY: '/users/me/activity',
    SETTINGS: '/users/me/settings',
    PASSWORD: '/users/me/password',
    EXPORT: '/users/me/export',
  },

  // Family
  // Family
  FAMILY: {
    CREATE: '/families',
    LIST: '/families', 
    MY_FAMILY: '/families/my-family', 
    DETAILS: (id: string) => `/families/${id}`,
    USAGE: (id: string) => `/families/${id}/usage`,
    MEMBERS: (id: string) => `/families/${id}/members`,
    INVITE: (id: string) => `/families/${id}/invite`,
    REMOVE_MEMBER: (id: string, userId: string) => `/families/${id}/members/${userId}`,
    TRANSFER_OWNERSHIP: (id: string) => `/families/${id}/transfer-ownership`,
    ACCEPT_INVITE: (id: string) => `/families/${id}/accept`,
  },
  
  // Content
  CONTENTS: {
    LIST: '/contents',
    MY_CONTENTS: '/contents/my-contents',
    GET: (id: string) => `/contents/${id}`,
    DELETE: (id: string) => `/contents/${id}`,
    BULK_DELETE: '/contents/bulk-delete',
    CREATE_MANUAL: '/contents/create_manual',
    UPLOAD: '/contents/upload',
    FILE_VIEW_URL: (fileId: string) => `/files/${fileId}/view-url`,
    SHARES: (contentId: string) => `/contents/${contentId}/shares`,
  },
  
  // Cornell Notes
  CORNELL_NOTES: (contentId: string) => `/contents/${contentId}/cornell`,
  HIGHLIGHTS: (contentId: string) => `/contents/${contentId}/highlights`,
  HIGHLIGHT: (id: string) => `/highlights/${id}`,
  HIGHLIGHT_VISIBILITY: (contentId: string, highlightId: string) => `/contents/${contentId}/highlights/${highlightId}/visibility`,
  
  // Study Groups
  STUDY_GROUPS: '/study-groups',
  STUDY_GROUP: (id: string) => `/study-groups/${id}`,
  
  // Institutions
  INSTITUTIONS: {
    LIST: '/institutions',
    CREATE: '/institutions',
    GET: (id: string) => `/institutions/${id}`,
    UPDATE: (id: string) => `/institutions/${id}`,
    DELETE: (id: string) => `/institutions/${id}`,
    
    // Invites
    INVITES: (id: string) => `/institutions/${id}/invites`,
    CREATE_INVITE: (id: string) => `/institutions/${id}/invites`,
    CANCEL_INVITE: (id: string, inviteId: string) => `/institutions/${id}/invites/${inviteId}`,
    
    // Domains
    DOMAINS: (id: string) => `/institutions/${id}/domains`,
    ADD_DOMAIN: (id: string) => `/institutions/${id}/domains`,
    REMOVE_DOMAIN: (id: string, domainId: string) => `/institutions/${id}/domains/${domainId}`,
    
    // Approvals
    PENDING: (id: string) => `/institutions/${id}/pending`,
    APPROVE: (id: string, approvalId: string) => `/institutions/${id}/pending/${approvalId}`,
    
    // SSO
    SSO_GET: (id: string) => `/institutions/${id}/sso`,
    SSO_CREATE: (id: string) => `/institutions/${id}/sso`,
    SSO_UPDATE: (id: string) => `/institutions/${id}/sso`,
    SSO_DELETE: (id: string) => `/institutions/${id}/sso`,
    SSO_TEST: (id: string) => `/institutions/${id}/sso/test`,
    
    // My Institution (for INSTITUTION_ADMIN)
    MY_INSTITUTION: '/institutions/my-institution',
  },
  
  // Assessments
  ASSESSMENTS: {
    LIST: '/assessment',
    CREATE: '/assessment',
  },
  
  // Reading Sessions (NEW - Phase 3)
  SESSIONS: {
    START: '/sessions/start',
    GET: (id: string) => `/sessions/${id}`,
    PROMPT: (id: string) => `/sessions/${id}/prompt`,
    FINISH: (id: string) => `/sessions/${id}/finish`,
    EVENTS: (id: string) => `/sessions/${id}/events`,
  },
  
  // Games
  GAMES: {
    CATALOG: '/games',
    PROGRESS: '/games/progress',
    GAME_PROGRESS: (gameId: string) => `/games/progress/${gameId}`,
    LEADERBOARD: '/games/leaderboard',
    MY_RANK: '/games/leaderboard/me',
    QUESTIONS: (gameId: string) => `/games/${gameId}/questions`,
    SUBMIT: (gameId: string) => `/games/${gameId}/results`,
  },
} as const;

/**
 * WebSocket namespaces
 */
export const WS_NAMESPACES = {
  STUDY_GROUPS: '/study-groups',
  NOTIFICATIONS: '/notifications',
} as const;

/**
 * Environment helpers
 */
export const isDevelopment = process.env.NEXT_PUBLIC_ENV === 'development';
export const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';
