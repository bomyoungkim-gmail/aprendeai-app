import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  settings?: {
    primaryFamilyId?: string;
    [key: string]: any;
  };
}

interface AuthState {
  token: string | null;
  refreshToken: string | null; // NEW
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, refreshToken: string, user: User) => void; // UPDATED
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>; // NEW
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      refreshUser: async () => {
        try {
          const response = await api.get('/auth/profile');
          const updatedUser = response.data;
          set({ user: updatedUser });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
      refreshAccessToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            console.error('[Auth Store] No refresh token available');
            return false;
          }

          console.log('[Auth Store] Refreshing access token...');
          const response = await api.post('/auth/refresh', {
            refresh_token: currentRefreshToken,
          });

          const { access_token, user } = response.data;
          set({ token: access_token, user });
          console.log('[Auth Store] Access token refreshed successfully');
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
