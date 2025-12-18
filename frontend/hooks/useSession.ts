import { useState, useEffect, useCallback } from 'react';

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
        const response = await fetch(`/api/reading-sessions/${cachedSessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          setLoading(false);
          return;
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
      const response = await fetch(`/api/contents/${contentId}/reading-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
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
      const response = await fetch(`/api/reading-sessions/${session.id}/pre`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update pre-phase');
      }

      const updatedSession = await response.json();
      setSession(updatedSession);
      
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pre-phase');
      throw err;
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
      const response = await fetch(`/api/reading-sessions/${session.id}/advance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toPhase }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to advance phase');
      }

      const updatedSession = await response.json();
      setSession(updatedSession);
      
      // Clear cache if session finished
      if (toPhase === 'FINISHED') {
        localStorage.removeItem(`session_${contentId}`);
      }
      
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance phase');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session, contentId]);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/reading-sessions/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
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
