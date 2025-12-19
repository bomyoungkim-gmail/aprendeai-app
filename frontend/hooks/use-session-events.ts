'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';

export enum StudyGroupEvent {
  SESSION_STARTED = 'session.started',
  SESSION_ENDED = 'session.ended',
  SESSION_UPDATED = 'session.updated',
  ROUND_ADVANCED = 'round.advanced',
  ROUND_UPDATED = 'round.updated',
  PROMPT_UPDATED = 'prompt.updated',
  VOTE_SUBMITTED = 'vote.submitted',
  REVOTE_SUBMITTED = 'revote.submitted',
  EXPLANATION_SUBMITTED = 'explanation.submitted',
  SHARED_CARD_CREATED = 'sharedCard.created',
  USER_JOINED = 'userJoined',
  USER_LEFT = 'userLeft',
}

interface UseSessionEventsOptions {
  onSessionUpdate?: (data: any) => void;
  onRoundAdvanced?: (data: any) => void;
  onVoteSubmitted?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
}

export function useSessionEvents(sessionId: string, options: UseSessionEventsOptions = {}) {
  const { socket, isConnected, isReconnecting, reconnectAttempts, joinSession, leaveSession } = useWebSocket();
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);

  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Join session on mount, leave on unmount
  useEffect(() => {
    if (!sessionId || !isConnected) return;

    joinSession(sessionId);

    return () => {
      leaveSession(sessionId);
    };
  }, [sessionId, isConnected, joinSession, leaveSession]);

  // Subscribe to events
  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = (data: any) => {
      console.log('[WebSocket] Session updated:', data);
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      optionsRef.current.onSessionUpdate?.(data);
    };

    const handleRoundAdvanced = (data: any) => {
      console.log('[WebSocket] Round advanced:', data);
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      optionsRef.current.onRoundAdvanced?.(data);
    };

    const handleVoteSubmitted = (data: any) => {
      console.log('[WebSocket] Vote submitted:', data);
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['events', sessionId] });
      optionsRef.current.onVoteSubmitted?.(data);
    };

    const handleUserJoined = (data: any) => {
      console.log('[WebSocket] User joined:', data);
      optionsRef.current.onUserJoined?.(data);
    };

    const handleUserLeft = (data: any) => {
      console.log('[WebSocket] User left:', data);
      optionsRef.current.onUserLeft?.(data);
    };

    // Subscribe to all events
    socket.on(StudyGroupEvent.SESSION_UPDATED, handleSessionUpdate);
    socket.on(StudyGroupEvent.SESSION_STARTED, handleSessionUpdate);
    socket.on(StudyGroupEvent.SESSION_ENDED, handleSessionUpdate);
    socket.on(StudyGroupEvent.ROUND_ADVANCED, handleRoundAdvanced);
    socket.on(StudyGroupEvent.ROUND_UPDATED, handleRoundAdvanced);
    socket.on(StudyGroupEvent.PROMPT_UPDATED, handleRoundAdvanced);
    socket.on(StudyGroupEvent.VOTE_SUBMITTED, handleVoteSubmitted);
    socket.on(StudyGroupEvent.REVOTE_SUBMITTED, handleVoteSubmitted);
    socket.on(StudyGroupEvent.SHARED_CARD_CREATED, handleRoundAdvanced);
    socket.on(StudyGroupEvent.USER_JOINED, handleUserJoined);
    socket.on(StudyGroupEvent.USER_LEFT, handleUserLeft);

    // Cleanup
    return () => {
      socket.off(StudyGroupEvent.SESSION_UPDATED, handleSessionUpdate);
      socket.off(StudyGroupEvent.SESSION_STARTED, handleSessionUpdate);
      socket.off(StudyGroupEvent.SESSION_ENDED, handleSessionUpdate);
      socket.off(StudyGroupEvent.ROUND_ADVANCED, handleRoundAdvanced);
      socket.off(StudyGroupEvent.ROUND_UPDATED, handleRoundAdvanced);
      socket.off(StudyGroupEvent.PROMPT_UPDATED, handleRoundAdvanced);
      socket.off(StudyGroupEvent.VOTE_SUBMITTED, handleVoteSubmitted);
      socket.off(StudyGroupEvent.REVOTE_SUBMITTED, handleVoteSubmitted);
      socket.off(StudyGroupEvent.SHARED_CARD_CREATED, handleRoundAdvanced);
      socket.off(StudyGroupEvent.USER_JOINED, handleUserJoined);
      socket.off(StudyGroupEvent.USER_LEFT, handleUserLeft);
    };
  }, [socket, sessionId, queryClient]);

  return { isConnected, isReconnecting, reconnectAttempts };
}
