'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useGroup } from './GroupContext';
import api from '@/lib/api';
import { ROUTES_WITH_PARAMS, ROUTE_ERRORS } from '@/lib/config/routes';

interface Session {
  id: string;
  groupId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  contentId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  currentRoundId: string | null;
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  isActive: boolean;
  canModify: boolean;
  error: string | null;
  groupId: string;
  sessionId: string;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  sessionId: string;
  children: ReactNode;
}

export function SessionProvider({ sessionId, children }: SessionProviderProps) {
  const { group, isOwner } = useGroup();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      if (!group) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/groups/${group.id}/sessions/${sessionId}`);
        const sessionData: Session = response.data;

        // Verify session belongs to this group
        if (sessionData.groupId !== group.id) {
          throw new Error('Session does not belong to this group');
        }

        setSession(sessionData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch session:', err);
        setError(err.response?.data?.message || 'Failed to load session');
        
        // Redirect on error
        if (err.response?.status === 404) {
          router.push(ROUTES_WITH_PARAMS.GROUP_WITH_ERROR(group.id, ROUTE_ERRORS.SESSION_NOT_FOUND));
        } else {
          router.push(ROUTES_WITH_PARAMS.GROUP_WITH_ERROR(group.id, ROUTE_ERRORS.SESSION_FORBIDDEN));
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [sessionId, group, router]);

  const isActive = session?.status === 'ACTIVE';
  const canModify = isOwner; // Only group owner can modify sessions

  const value: SessionContextType = {
    session,
    isLoading,
    isActive,
    canModify,
    error,
    groupId: group?.id || '',
    sessionId,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push(ROUTES_WITH_PARAMS.GROUP_WITH_ERROR(group?.id || '', ROUTE_ERRORS.SESSION_NOT_FOUND))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
