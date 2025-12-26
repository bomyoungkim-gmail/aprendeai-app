import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { API_BASE_URL } from '@/lib/config/api';
import { shouldRefreshToken } from '@/lib/validate-token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fix #3: Race condition prevention with promise queue
// Source: https://medium.com/... (Axios interceptor best practices)
let refreshTokenPromise: Promise<boolean> | null = null;

// Fix #4: Optimize proactive refresh - check only once per minute
// Source: https://dev.to/... (Proactive vs Reactive comparison)
let lastTokenCheck = 0;
const CHECK_INTERVAL = 60 * 1000; // Check token expiry max once per minute

// Request interceptor: Add token and refresh proactively if needed
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  
  // CRITICAL: Skip token refresh check for /auth/refresh to prevent infinite loop
  if (config.url?.includes('/auth/refresh')) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
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
      
      console.log('[API] Received 401, attempting token refresh...');
      
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
