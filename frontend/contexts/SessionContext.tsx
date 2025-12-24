'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGroup } from './GroupContext';
import api from '@/lib/api';
import { ROUTES_WITH_PARAMS, ROUTE_ERRORS } from '@/lib/config/routes';
import { API_ENDPOINTS } from '@/lib/config/api';
import { Message, PromptMessageDto, AgentTurnResponse } from '@/types/session';

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
  // Existing fields (keep all)
  session: Session | null;
  isLoading: boolean;
  isActive: boolean;
  canModify: boolean;
  error: string | null;
  groupId: string;
  sessionId: string;
  
  // NEW: Prompt-only interface fields (Phase 3)
  messages: Message[];
  quickReplies: string[];
  sendPrompt: (text: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  sessionId: string;
  children: ReactNode;
}

export function SessionProvider({ sessionId, children }: SessionProviderProps) {
  // Try to get group context, but don't fail if not available (solo mode)
  let group = null;
  let isOwner = false;
  try {
    const groupContext = useGroup();
    group = groupContext.group;
    isOwner = groupContext.isOwner;
  } catch {
    // Solo mode - no group context available
  }

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // NEW: Prompt-only state (Phase 3)
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSession() {

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
  
  // NEW: Send prompt to AI service (Phase 3)
  const sendPrompt = useCallback(async (text: string) => {
    if (!session) {
      console.error('Cannot send prompt: no active session');
      return;
    }
    
    // Add user message immediately (optimistic UI)
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
      status: 'sending',
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Prepare prompt message DTO
      const promptMessage: PromptMessageDto = {
        threadId: session.id, // Using session ID as thread ID for Phase 3
        readingSessionId: session.id,
        actorRole: 'LEARNER',
        text,
        clientTs: new Date().toISOString(),
        metadata: {
          uiMode: 'DURING', // Default to DURING, can be dynamic later
          contentId: session.contentId || '',
          assetLayer: 'L1', // Default, can be dynamic
          readingIntent: 'analytical',
        },
      };
      
      // Call backend using centralized API endpoints
      const response = await api.post<AgentTurnResponse>(
        API_ENDPOINTS.SESSIONS.PROMPT(session.id),
        promptMessage
      );
      
      // Update user message status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
      
      // Add agent response
      const agentMessage: Message = {
        id: `msg_${Date.now()}_agent`,
        role: 'agent',
        text: response.data.nextPrompt,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      
      // Update quick replies
      setQuickReplies(response.data.quickReplies || []);
      
    } catch (err: any) {
      console.error('Failed to send prompt:', err);
      
      // Mark user message as error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      
      // Show error message from agent
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'agent',
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [session]);

  const value: SessionContextType = {
    // Existing values (keep all)
    session,
    isLoading,
    isActive,
    canModify,
    error,
    groupId: group?.id || '',
    sessionId,
    
    // NEW: Prompt-only values (Phase 3)
    messages,
    quickReplies,
    sendPrompt,
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
