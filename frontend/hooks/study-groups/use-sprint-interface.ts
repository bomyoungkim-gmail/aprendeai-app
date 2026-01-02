import { useState, useMemo, useEffect } from 'react';
import { GroupSession, GroupRound } from '@/lib/types/study-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useRoundTimer } from '@/hooks/games/use-round-timer';
import { useStartSession, useAdvanceRound, useSharedCards } from '@/hooks/sessions/group/use-sessions';
import { useSessionEvents } from '@/hooks/sessions/group/use-session-events';
import { isInputLike } from '@/lib/utils/dom';

export function useSprintInterface(session: GroupSession) {
  const { user } = useAuthStore();
  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [selectedHighlightIds, setSelectedHighlightIds] = useState<string[]>([]);
  const [showSharedCards, setShowSharedCards] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'round' | 'reference' | 'cards'>('round');
  
  // WebSocket real-time connection
  const { isConnected, isReconnecting, reconnectAttempts } = useSessionEvents(session.id, {
    onRoundAdvanced: (data) => {
      console.log('Round advanced in real-time:', data);
    },
  });
  
  const startSession = useStartSession(session.id);
  const advanceRound = useAdvanceRound(session.id);
  const { data: sharedCards } = useSharedCards(session.id);
  
  const currentRound = useMemo(() => {
    return session.rounds?.find(r => r.roundIndex === currentRoundIndex);
  }, [session.rounds, currentRoundIndex]);
  
  const { formatted: timeFormatted, isExpired } = useRoundTimer(currentRound || null);
  
  const mySessionMember = session.members?.find(m => m.userId === user?.id);
  const myGroupRole = session.group?.members?.find(m => m.userId === user?.id)?.role;
  
  const canAdvance = mySessionMember?.assignedRole === 'FACILITATOR' || 
                     myGroupRole === 'OWNER' || 
                     myGroupRole === 'MOD';

  // Connection status formatting
  const connectionStatus = isReconnecting 
    ? `Reconnecting${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : '...'}` 
    : isConnected 
    ? 'Live' 
    : 'Offline';
  
  const connectionColor = isReconnecting 
    ? 'text-yellow-600' 
    : isConnected 
    ? 'text-green-600' 
    : 'text-gray-400';

  const handleStartSession = async () => {
    try {
      await startSession.mutateAsync();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleAdvanceRound = async (toStatus: string) => {
    if (!currentRound) return;
    
    try {
      await advanceRound.mutateAsync({
        roundIndex: currentRound.roundIndex,
        toStatus,
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert(error.response.data.message);
      } else {
        console.error('Failed to advance round:', error);
      }
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      FACILITATOR: 'bg-purple-100 text-purple-800',
      TIMEKEEPER: 'bg-blue-100 text-blue-800',
      CLARIFIER: 'bg-green-100 text-green-800',
      CONNECTOR: 'bg-yellow-100 text-yellow-800',
      SCRIBE: 'bg-red-100 text-red-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Keyboard shortcuts for round navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (isInputLike(e.target)) {
        return;
      }

      const totalRounds = session.rounds?.length || 1;

      switch (e.key) {
        case 'ArrowLeft':
          if (currentRoundIndex > 1) {
            setCurrentRoundIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (currentRoundIndex < totalRounds) {
            setCurrentRoundIndex(prev => prev + 1);
          }
          break;
        case 'Home':
          setCurrentRoundIndex(1);
          break;
        case 'End':
          setCurrentRoundIndex(totalRounds);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRoundIndex, session.rounds?.length]);

  return {
    // State
    currentRoundIndex,
    setCurrentRoundIndex,
    selectedHighlightIds,
    setSelectedHighlightIds,
    showSharedCards,
    setShowSharedCards,
    mobileActiveTab,
    setMobileActiveTab,
    
    // Computed / Data
    currentRound,
    mySessionMember,
    canAdvance,
    sharedCards,
    timeFormatted,
    isExpired,
    connectionStatus,
    connectionColor,
    isConnected,
    isReconnecting,
    reconnectAttempts,
    isStarting: startSession.isPending,
    
    // Handlers
    handleStartSession,
    handleAdvanceRound,
    getRoleColor,
  };
}
