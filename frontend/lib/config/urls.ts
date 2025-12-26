/**
 * Centralized URL Configuration for Frontend
 * 
 * Single source of truth for all external service URLs
 */

const IS_BROWSER = typeof window !== 'undefined';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Get environment variable with validation
 */
function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  
  if (!value && !fallback && IS_PRODUCTION) {
    throw new Error(
      `❌ ${key} environment variable is required in production`
    );
  }
  
  return value || fallback || '';
}

/**
 * URL Configuration
 */
export const URLS = {
  // API Base URL
  api: {
    base: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4000'),
    
    get v1(): string {
      return `${this.base}/api/v1`;
    },
    
    get health(): string {
      return `${this.base}/health`;
    },
    
    get docs(): string {
      return `${this.base}/api/docs`;
    },
  },
  
  // WebSocket URL
  ws: {
    get base(): string {
      // Derive from API URL if not set
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (wsUrl) return wsUrl;
      
      // Convert http://localhost:4000 -> ws://localhost:4000
      const apiUrl = URLS.api.base;
      return apiUrl.replace(/^http/, 'ws');
    },
  },
  
  // AI Service (if frontend calls directly)
  ai: {
    base: getEnv('NEXT_PUBLIC_AI_URL', 'http://localhost:8001'),
  },
  
  // Current frontend URL (for sharing links, etc)
  frontend: {
    get base(): string {
      if (IS_BROWSER) {
        return window.location.origin;
      }
      return getEnv('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000');
    },
  },
} as const;

/**
 * Export for backward compatibility
 */
export const API_BASE_URL = URLS.api.v1;
export const urls = URLS;

export default URLS;
