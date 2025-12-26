'use client';

import { useContext } from 'react';
import { useSession } from '@/contexts/SessionContext';

/**
 * Unified hook to get study session context
 * Works in both solo and group study scenarios
 * 
 * In solo study: returns null for groupId and sessionId
 * In group study: returns actual IDs from context
 */
export function useStudySession() {
  try {
    // Try to get session context (will throw if not in SessionProvider)
    const sessionContext = useSession();
    
    return {
      groupId: sessionContext.groupId,
      sessionId: sessionContext.sessionId,
      isInSession: true,
      isActive: sessionContext.isActive,
      canModify: sessionContext.canModify,
    };
  } catch {
    // Not in a session context - solo study
    return {
      groupId: null,
      sessionId: null,
      isInSession: false,
      isActive: false,
      canModify: true, // In solo study, user can modify everything
    };
  }
}
