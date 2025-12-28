'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ROUTES, ROUTES_WITH_PARAMS, ROUTE_ERRORS } from '@/lib/config/routes';
import type { Group, GroupMember } from '@/lib/types/group';

interface GroupContextType {
  group: Group | null;
  isLoading: boolean;
  isMember: boolean;
  isOwner: boolean;
  error: string | null;
}

const GroupContext = createContext<GroupContextType | null>(null);

interface GroupProviderProps {
  groupId: string;
  children: ReactNode;
}

export function GroupProvider({ groupId, children }: GroupProviderProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchGroup() {
      try {
        setIsLoading(true);
        const response = await api.get(`/groups/${groupId}`);
        setGroup(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch group:', err);
        setError(err.response?.data?.message || 'Failed to load group');
        
        // Redirect on unauthorized
        if (err.response?.status === 403) {
          router.push(ROUTES_WITH_PARAMS.GROUPS_WITH_ERROR(ROUTE_ERRORS.NOT_MEMBER));
        } else {
          router.push(ROUTES_WITH_PARAMS.GROUPS_WITH_ERROR(ROUTE_ERRORS.NOT_FOUND));
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (groupId) {
      fetchGroup();
    }
  }, [groupId, router]);

  // Get current user from auth (you might have a useAuth hook)
  const currentUserId = typeof window !== 'undefined' 
    ? localStorage.getItem('userId') 
    : null;

  const isMember = group?.members.some(m => m.userId === currentUserId) ?? false;
  const isOwner = group?.ownerUserId === currentUserId;

  const value: GroupContextType = {
    group,
    isLoading,
    isMember,
    isOwner,
    error,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error || 'Group not found'}</p>
          <button
            onClick={() => router.push(ROUTES.GROUPS.HOME)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  // Check membership
  if (!isMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not a Member</h2>
          <p className="text-gray-600 mb-4">You are not a member of this group.</p>
          <button
            onClick={() => router.push(ROUTES.GROUPS.HOME)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within GroupProvider');
  }
  return context;
}
