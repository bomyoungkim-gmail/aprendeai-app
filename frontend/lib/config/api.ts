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
  },
  
  // Health
  HEALTH: '/health',
  
  // Family
  FAMILIES: '/families',
  FAMILY: (id: string) => `/families/${id}`,
  FAMILY_USAGE: (id: string) => `/families/${id}/usage`,
  FAMILY_MEMBERS: (id: string) => `/families/${id}/members`,
  FAMILY_INVITE: (id: string) => `/families/${id}/invite`,
  
  // Content
  CONTENTS: '/contents',
  CONTENT: (id: string) => `/contents/${id}`,
  
  // Cornell Notes
  CORNELL_NOTES: (contentId: string) => `/contents/${contentId}/cornell`,
  HIGHLIGHTS: (contentId: string) => `/contents/${contentId}/highlights`,
  HIGHLIGHT: (id: string) => `/highlights/${id}`,
  
  // Study Groups
  STUDY_GROUPS: '/study-groups',
  STUDY_GROUP: (id: string) => `/study-groups/${id}`,
  
  // Reading Sessions (NEW - Phase 3)
  SESSIONS: {
    START: '/sessions/start',
    GET: (id: string) => `/sessions/${id}`,
    PROMPT: (id: string) => `/sessions/${id}/prompt`,
    FINISH: (id: string) => `/sessions/${id}/finish`,
    EVENTS: (id: string) => `/sessions/${id}/events`,
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
