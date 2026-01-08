import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { API_BASE_URL } from '@/lib/config/api';
import { shouldRefreshToken } from '@/lib/validate-token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Fix #3: Race condition prevention with promise queue
// Source: https://medium.com/... (Axios interceptor best practices)
let refreshTokenPromise: Promise<boolean> | null = null;

// Fix #4: Optimize proactive refresh - check only once per minute
// Source: https://dev.to/... (Proactive vs Reactive comparison)
// In test environments, increase interval to avoid unnecessary refresh attempts
const isTestEnv = typeof window !== 'undefined' && (window as any).Playwright;
let lastTokenCheck = 0;
const CHECK_INTERVAL = isTestEnv ? 60 * 60 * 1000 : 60 * 1000; // 1 hour in tests, 1 min in prod

// Fix #5: Validate JWT format to prevent "jwt malformed" errors
// A valid JWT has exactly 3 parts (header.payload.signature) separated by dots
function isValidJWTFormat(token: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

// Request interceptor: Add token and refresh proactively if needed
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  
  // CRITICAL: Skip token refresh check for public auth routes to prevent loops/redundancy
  const isPublicAuthRoute = 
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register') ||
    config.url?.includes('/auth/refresh') ||
    config.url?.includes('/auth/forgot-password') ||
    config.url?.includes('/auth/reset-password');

  if (isPublicAuthRoute) {
    // For refresh specifically, we still need the old token if any
    if (config.url?.includes('/auth/refresh') && token) {
      // Validate token format even for refresh
      if (isValidJWTFormat(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('[API] Malformed JWT detected on refresh, clearing auth state');
        useAuthStore.getState().logout();
        return Promise.reject(new Error('Invalid token format'));
      }
    }
    return config;
  }
  
  // Fix #5: Validate token format before using it to prevent "jwt malformed" errors
  if (token && !isValidJWTFormat(token)) {
    console.error('[API] Malformed JWT detected, clearing auth state');
    useAuthStore.getState().logout();
    return Promise.reject(new Error('Invalid token format'));
  }
  
  // Fix #4: Only check token expiry once per minute (not on every request)
  const now = Date.now();
  if (token && (now - lastTokenCheck > CHECK_INTERVAL)) {
    lastTokenCheck = now;
    
    if (shouldRefreshToken(token)) {
      console.log('[API] Access token expiring soon, refreshing proactively...');
      
      // Fix #3: Use promise queue to prevent concurrent refresh attempts
      if (!refreshTokenPromise) {
        refreshTokenPromise = useAuthStore
          .getState()
          .refreshAccessToken()
          .finally(() => {
            refreshTokenPromise = null; // Reset after completion
          });
      }
      
      // All concurrent requests wait for same promise
      const refreshed = await refreshTokenPromise;
      
      if (refreshed) {
        const newToken = useAuthStore.getState().token;
        if (newToken && isValidJWTFormat(newToken)) {
          config.headers.Authorization = `Bearer ${newToken}`;
        } else if (newToken) {
          console.error('[API] Refreshed token is malformed');
          useAuthStore.getState().logout();
        }
      } else {
        console.error('[API] Proactive refresh failed');
      }
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else if (token) {
    // Token already checked recently, just use it
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor: Handle 401 by attempting refresh and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const requestedUrl = originalRequest.url || '';
      console.log(`[API] Received 401 from: ${requestedUrl}, checking if refresh is appropriate...`);
      
      // Skip refresh for public auth routes (e.g., login failure)
      // We check for both relative and absolute matches
      const isPublicAuthRoute = 
        requestedUrl.includes('/auth/login') ||
        requestedUrl.includes('/auth/register') ||
        requestedUrl.includes('/auth/refresh') ||
        requestedUrl.includes('/auth/forgot-password') ||
        requestedUrl.includes('/auth/reset-password');

      if (isPublicAuthRoute) {
        console.log(`[API] Skipping refresh for public route: ${requestedUrl}`);
        return Promise.reject(error);
      }

      console.log('[API] Attempting token refresh for non-public route...');
      
      // Fix #3: Use same promise queue pattern for reactive refresh
      if (!refreshTokenPromise) {
        refreshTokenPromise = useAuthStore
          .getState()
          .refreshAccessToken()
          .finally(() => {
            refreshTokenPromise = null;
          });
      }
      
      const refreshed = await refreshTokenPromise;
      
      if (refreshed) {
        // Retry the original request with new token
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } else {
        // Refresh failed - user will be logged out by store
        console.error('[API] Token refresh failed, session expired');
        // Optionally show session expired modal here
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };
export default api;
