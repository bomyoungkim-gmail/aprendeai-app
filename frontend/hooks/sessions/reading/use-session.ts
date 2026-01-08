import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { DecisionPolicyV1 } from '@/types/session';

interface ReadingSession {
  id: string;
  userId: string;
  contentId: string;
  phase: 'PRE' | 'DURING' | 'POST' | 'FINISHED';
  modality: 'READING' | 'LISTENING' | 'WRITING';
  assetLayer: string;
  goalStatement?: string;
  predictionText?: string;
  targetWordsJson?: string[];
  startedAt: string;
  finishedAt?: string;
  minTargetWords?: number;
  decision_policy?: DecisionPolicyV1; // Policy for this session
  content?: {
    id: string;
    title: string;
    type: string;
  };
  outcome?: {
    comprehensionScore: number;
    productionScore: number;
    frustrationIndex: number;
  };
}

interface PrePhaseData {
  goalStatement: string;
  predictionText: string;
  targetWordsJson: string[];
}

export function useSession(contentId: string) {
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      // Try to get existing session from localStorage first
      const cachedSessionId = localStorage.getItem(`session_${contentId}`);
      
      if (cachedSessionId) {
        try {
          const { data } = await api.get(`/reading-sessions/${cachedSessionId}`);
          setSession(data);
          setLoading(false);
          return;
        } catch (err) {
          // Session not found, will create new one
        }
      }

      // No existing session, create new one
      await startSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  const startSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/contents/${contentId}/reading-sessions`);
      setSession(data);
      
      // Cache session ID
      localStorage.setItem(`session_${contentId}`, data.id);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  const updatePrePhase = useCallback(async (data: PrePhaseData) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setLoading(true);
      const { data: updatedSession } = await api.put(`/reading-sessions/${session.id}/pre`, data);
      setSession(updatedSession);
      
      return updatedSession;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update pre-phase';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const advancePhase = useCallback(async (toPhase: 'POST' | 'FINISHED') => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setLoading(true);
      const { data: updatedSession } = await api.post(`/reading-sessions/${session.id}/advance`, { toPhase });
      setSession(updatedSession);
      
      // Clear cache if session finished
      if (toPhase === 'FINISHED') {
        localStorage.removeItem(`session_${contentId}`);
      }
      
      return updatedSession;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to advance phase';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [session, contentId]);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    
    try {
      const { data } = await api.get(`/reading-sessions/${session.id}`);
      setSession(data);
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  }, [session]);

  useEffect(() => {
    if (contentId) {
      fetchSession();
    }
  }, [contentId, fetchSession]);

  return {
    session,
    loading,
    error,
    startSession,
    updatePrePhase,
    advancePhase,
    refreshSession,
  };
}
