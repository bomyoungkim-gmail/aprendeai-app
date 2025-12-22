/**
 * Centralized API Routes (Frontend Mirror)
 * Mirrors backend routes.constants.ts for type-safe API calls
 */

const API_PREFIX = '/api/v1';

export const ROUTES = {
  // OpsCoach routes
  OPS: {
    DAILY_SNAPSHOT: `${API_PREFIX}/ops/daily-snapshot`,
    WHAT_NEXT: `${API_PREFIX}/ops/what-next`,
    CONTEXT_CARDS: `${API_PREFIX}/ops/context-cards`,
    LOG_TIME: `${API_PREFIX}/ops/log`,
    BOOT_PROMPT: `${API_PREFIX}/ops/boot`,
    CLOSE_PROMPT: `${API_PREFIX}/ops/close`,
  },
  
  // Family routes
  FAMILY: {
    BASE: `${API_PREFIX}/families`,
    POLICY: `${API_PREFIX}/families/policy`,
    EDUCATOR_DASHBOARD: (familyId: string, learnerId: string) => 
      `${API_PREFIX}/families/${familyId}/educator-dashboard/${learnerId}`,
    CO_SESSION_START: `${API_PREFIX}/families/co-sessions/start`,
    TEACHBACK_START: `${API_PREFIX}/families/teachback/start`,
  },
  
  // Classroom routes
  CLASSROOM: {
    BASE: `${API_PREFIX}/classrooms`,
    BY_ID: (id: string) => `${API_PREFIX}/classrooms/${id}`,
    DASHBOARD: (id: string) => `${API_PREFIX}/classrooms/${id}/dashboard`,
  },
  
  // Session routes
  SESSION: {
    BASE: `${API_PREFIX}/sessions`,
    START: `${API_PREFIX}/sessions/start`,
    BY_ID: (id: string) => `${API_PREFIX}/sessions/${id}`,
  },
  
  // Review routes
  REVIEW: {
    BASE: `${API_PREFIX}/review`,
    DUE: `${API_PREFIX}/review/due`,
  },
} as const;

export default ROUTES;
