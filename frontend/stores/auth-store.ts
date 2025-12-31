import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  // Legacy role field removed - CONTRACT phase
  systemRole?: string; // Global system role (ADMIN, SUPPORT, OPS)
  contextRole?: string; // Context-specific role (OWNER, TEACHER, STUDENT, etc.)
  activeInstitutionId?: string; // Currently active institution
  institutionMemberships?: Array<{
    institution: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  settings?: {
    primaryFamilyId?: string;
    [key: string]: any;
  };
}

interface AuthState {
  token: string | null;
  // refreshToken removed - now stored in HTTP-only cookie
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, user: User) => void; // refreshToken param removed
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  switchContext: (institutionId: string) => Promise<boolean>; // NEW action
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      // refreshToken removed - stored in HTTP-only cookie
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (token, user) => set({ token, user }), // refreshToken param removed
      logout: () => set({ token: null, user: null }),
      refreshUser: async () => {
        try {
          const response = await api.get('/auth/profile');
          const updatedUser = response.data;
          set({ user: updatedUser });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
      switchContext: async (institutionId: string) => {
        try {
          console.log('[Auth Store] Switching context to:', institutionId);
          const response = await api.post('/auth/switch-context', {
            institutionId,
          });
          
          const { access_token, user } = response.data;
          // Verify we got the new token and user
          if (access_token && user) {
            set({ token: access_token, user }); // Update token and user with new context
            return true;
          }
          return false;
        } catch (error) {
           console.error('[Auth Store] Failed to switch context:', error);
           return false;
        }
      },
      refreshAccessToken: async () => {
        try {
          console.log('[Auth Store] Refreshing access token...');
          // Refresh token is sent automatically via HTTP-only cookie
          const response = await api.post('/auth/refresh', {});

          const { access_token, user } = response.data;
          set({ token: access_token, user });
          console.log('[Auth Store] Access token refreshed successfully');
          
          // CRITICAL: Invalidate React Query cache to force re-fetch with new token
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('token-refreshed'));
          }
          
          return true;
        } catch (error) {
          console.error('[Auth Store] Failed to refresh token:', error);
          // Clear auth state on refresh failure
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      skipHydration: true, // Manual hydration for SSR/E2E reliability
      onRehydrateStorage: () => (state) => {
        console.log('[auth-store] onRehydrateStorage called, state:', state);
        console.log('[auth-store] Setting _hasHydrated to true');
        state?.setHasHydrated(true);
      },
    }
  )
);
