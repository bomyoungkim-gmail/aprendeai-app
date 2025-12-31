'use client';

import { create } from 'zustand';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  // Dual-role system
  systemRole?: string;
  contextRole?: string;
  activeInstitutionId?: string;
  permissions: string[];
}

interface AdminStore {
  user: AdminUser | null;
  token: string | null;
  setUser: (user: AdminUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
    set({ token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    set({ user: null, token: null });
  },
}));

// Hook para usar informações do admin
export function useAdmin() {
  const { user, token, setUser, setToken, logout } = useAdminStore();
  
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const isRole = (...roles: string[]) => {
    if (!user) return false;
    // Check systemRole OR contextRole (dual-role system)
    return (user.systemRole && roles.includes(user.systemRole)) || 
           (user.contextRole && roles.includes(user.contextRole));
  };

  return {
    user,
    token,
    setUser,
    setToken,
    logout,
    hasPermission,
    isRole,
    isAuthenticated: !!token && !!user,
  };
}
