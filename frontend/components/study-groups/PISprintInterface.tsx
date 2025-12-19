'use client';

import { useState, useMemo, useEffect } from 'react';
import { GroupSession } from '@/lib/types/study-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useRoundTimer } from '@/hooks/use-round-timer';
import { useStartSession, useAdvanceRound, useSharedCards } from '@/hooks/use-sessions';
import { useSessionEvents } from '@/hooks/use-session-events';
import { RoundPanel } from './RoundPanel';
import { ReferencePanel } from './ReferencePanel';
import { SharedCardsDrawer } from './SharedCardsDrawer';
import { MobileTabBar } from './MobileTabBar';
import { RoundNavigator } from './RoundNavigator';
import { Timer, Play, List, Wifi, WifiOff } from 'lucide-react';

interface PISprintInterfaceProps {
  session: GroupSession;
}

export function PISprintInterface({ session }: PISprintInterfaceProps) {
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

  // Connection status label
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
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
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

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* TopBar - Responsive */}
      <div className="bg-white border-b px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Session Info */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="min-w-0">
              <h2 className="text-sm md:text-lg font-semibold truncate">{session.group?.name}</h2>
              <p className="text-xs md:text-sm text-gray-600 truncate">{session.content?.title}</p>
            </div>
            
            {/* Round & Status - Hide on small mobile */}
            <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm flex-shrink-0">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                Round {currentRoundIndex}/{session.rounds?.length || 0}
              </span>
              
              {currentRound && (
                <span className={`px-2 py-1 rounded whitespace-nowrap ${
                  currentRound.status === 'VOTING' ? 'bg-green-100 text-green-800' :
                  currentRound.status === 'DISCUSSING' ? 'bg-yellow-100 text-yellow-800' :
                  currentRound.status === 'REVOTING' ? 'bg-orange-100 text-orange-800' :
                  currentRound.status === 'EXPLAINING' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentRound.status}
                </span>
              )}
            </div>
          </div>
          
          {/* Right: Role, Connection, Timer, Actions */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Role Badge - Hide on mobile */}
            {mySessionMember && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs md:text-sm text-gray-600">You are:</span>
                <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-medium ${getRoleColor(mySessionMember.assignedRole)}`}>
                  {mySessionMember.assignedRole}
                </span>
              </div>
            )}
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center gap-1 text-xs ${connectionColor}`} title={connectionStatus}>
              {isReconnecting ? (
                <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isConnected ? (
                <Wifi className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <WifiOff className="w-3 h-3 md:w-4 md:h-4" />
              )}
              <span className="hidden sm:inline">{connectionStatus}</span>
            </div>
            
            {/* Timer */}
            {currentRound && currentRound.status !== 'DONE' && currentRound.status !== 'CREATED' && (
              <div className="flex items-center gap-1 md:gap-2 text-sm md:text-lg font-mono">
                <Timer className="w-3 h-3 md:w-5 md:h-5" />
                <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                  {timeFormatted}
                </span>
              </div>
            )}
            
            {/* Start Session Button */}
            {session.status === 'CREATED' && (
              <button
                onClick={handleStartSession}
                disabled={startSession.isPending}
                className="flex items-center gap-1 md:gap-2 bg-green-600 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-xs md:text-sm"
              >
                <Play className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Start</span>
              </button>
            )}
            
            {/* Shared Cards Button - Desktop only */}
            <button
              onClick={() => setShowSharedCards(true)}
              className="hidden lg:flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              <List className="w-4 h-4" />
              Shared Cards ({sharedCards?.length || 0})
            </button>
          </div>
        </div>
        
        {/* Mobile: Round & Status below on small screens */}
        <div className="flex sm:hidden items-center gap-2 mt-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            R{currentRoundIndex}/{session.rounds?.length || 0}
          </span>
          {currentRound && (
            <span className={`px-2 py-1 rounded ${
              currentRound.status === 'VOTING' ? 'bg-green-100 text-green-800' :
              currentRound.status === 'DISCUSSING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentRound.status}
            </span>
          )}
          {mySessionMember && (
            <span className={`px-2 py-1 rounded text-xs ${getRoleColor(mySessionMember.assignedRole)}`}>
              {mySessionMember.assignedRole}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <MobileTabBar
        activeTab={mobileActiveTab}
        onTabChange={(tab) => {
          setMobileActiveTab(tab);
          if (tab === 'cards') {
            setShowSharedCards(true);
          }
        }}
        sharedCardsCount={sharedCards?.length || 0}
      />

      {/* Main Content - Responsive */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: 2-column grid with round navigator */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 p-6 h-full">
          <div className="lg:col-span-2 overflow-y-auto space-y-4">
            {/* Round Navigator - Desktop */}
            {(session.rounds?.length || 0) > 1 && (
              <RoundNavigator
                currentRound={currentRoundIndex}
                totalRounds={session.rounds?.length || 1}
                onPrev={() => setCurrentRoundIndex(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentRoundIndex(prev => 
                  Math.min(session.rounds?.length || 1, prev + 1)
                )}
              />
            )}
            
            <RoundPanel 
              session={session}
              currentRound={currentRound || null}
              myRole={mySessionMember?.assignedRole || null}
              canAdvance={canAdvance}
              selectedHighlightIds={selectedHighlightIds}
              onAdvance={handleAdvanceRound}
            />
          </div>
          
          <div className="overflow-y-auto">
            <ReferencePanel 
              contentId={session.contentId}
              selectedIds={selectedHighlightIds}
              onSelectIds={setSelectedHighlightIds}
            />
          </div>
        </div>

        {/* Mobile/Tablet: Single panel based on active tab */}
        <div className="lg:hidden h-full overflow-y-auto">
          {/* Round Navigator - Mobile (only for Round tab) */}
          {mobileActiveTab === 'round' && (session.rounds?.length || 0) > 1 && (
            <div className="sticky top-0 bg-white border-b px-3 py-3 z-10">
              <RoundNavigator
                currentRound={currentRoundIndex}
                totalRounds={session.rounds?.length || 1}
                onPrev={() => setCurrentRoundIndex(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentRoundIndex(prev => 
                  Math.min(session.rounds?.length || 1, prev + 1)
                )}
              />
            </div>
          )}
          
          <div className="p-3 md:p-4">
            {mobileActiveTab === 'round' && (
            <RoundPanel 
              session={session}
              currentRound={currentRound || null}
              myRole={mySessionMember?.assignedRole || null}
              canAdvance={canAdvance}
              selectedHighlightIds={selectedHighlightIds}
              onAdvance={handleAdvanceRound}
            />
          )}
          
          {mobileActiveTab === 'reference' && (
            <ReferencePanel 
              contentId={session.contentId}
              selectedIds={selectedHighlightIds}
              onSelectIds={setSelectedHighlightIds}
            />
          )}
          
          {mobileActiveTab === 'cards' && (
            <div className="text-center text-gray-500 py-8">
              <p>Shared Cards opened in drawer</p>
            </div>
          )}
          </div>
        </div>
      </div>

      <SharedCardsDrawer 
        isOpen={showSharedCards}
        onClose={() => {
          setShowSharedCards(false);
          if (mobileActiveTab === 'cards') {
            setMobileActiveTab('round');
          }
        }}
        sharedCards={sharedCards || []}
      />
    </div>
  );
}
