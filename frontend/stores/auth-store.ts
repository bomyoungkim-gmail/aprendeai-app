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
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (token, user) => set({ token, user }),
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
