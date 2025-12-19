import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  schoolingLevel: string;
  preferredLanguages: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserStats {
  contentsRead: number;
  annotationsCreated: number;
  groupsJoined: number;
  sessionsAttended: number;
  studyHours: number;
}

export interface Activity {
  type: 'annotation' | 'group_join';
  description: string;
  timestamp: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    groupInvites: boolean;
    annotations: boolean;
    sessionReminders: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showStats: boolean;
    allowEmailDiscovery: boolean;
  };
}

// Get current user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data as UserProfile;
    },
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

// Get user statistics
export function useUserStats() {
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const response = await api.get('/users/me/stats');
      return response.data as UserStats;
    },
  });
}

// Get user activity
export function useUserActivity() {
  return useQuery({
    queryKey: ['user', 'activity'],
    queryFn: async () => {
      const response = await api.get('/users/me/activity');
      return response.data as Activity[];
    },
  });
}

// Get user settings
export function useUserSettings() {
  return useQuery({
    queryKey: ['user', 'settings'],
    queryFn: async () => {
      const response = await api.get('/users/me/settings');
      return response.data as UserSettings;
    },
  });
}

// Update user settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await api.put('/users/me/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'settings'] });
    },
  });
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/users/me/password', data);
      return response.data;
    },
  });
}

// Upload avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

// Delete account
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await api.delete('/users/me', { data: { password } });
      return response.data;
    },
  });
}
