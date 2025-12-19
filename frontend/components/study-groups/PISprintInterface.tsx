'use client';

import { useState, useMemo } from 'react';
import { GroupSession } from '@/lib/types/study-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useRoundTimer } from '@/hooks/use-round-timer';
import { useStartSession, useAdvanceRound, useSharedCards } from '@/hooks/use-sessions';
import { RoundPanel } from './RoundPanel';
import { ReferencePanel } from './ReferencePanel';
import { SharedCardsDrawer } from './SharedCardsDrawer';
import { Timer, Play, List } from 'lucide-react';

interface PISprintInterfaceProps {
  session: GroupSession;
}

export function PISprintInterface({ session }: PISprintInterfaceProps) {
  const { user } = useAuthStore();
  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [selectedHighlightIds, setSelectedHighlightIds] = useState<string[]>([]);
  const [showSharedCards, setShowSharedCards] = useState(false);
  
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

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* TopBar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">{session.group?.name}</h2>
              <p className="text-sm text-gray-600">{session.content?.title}</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                Round {currentRoundIndex}/{session.rounds?.length || 0}
              </span>
              
              {currentRound && (
                <span className={`px-2 py-1 rounded ${
                  currentRound. status === 'VOTING' ? 'bg-green-100 text-green-800' :
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
          
          <div className="flex items-center gap-4">
            {mySessionMember && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">You are:</span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getRoleColor(mySessionMember.assignedRole)}`}>
                  {mySessionMember.assignedRole}
                </span>
              </div>
            )}
            
            {currentRound && currentRound.status !== 'DONE' && currentRound.status !== 'CREATED' && (
              <div className="flex items-center gap-2 text-lg font-mono">
                <Timer className="w-5 h-5" />
                <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                  {timeFormatted}
                </span>
              </div>
            )}
            
            {session.status === 'CREATED' && (
              <button
                onClick={handleStartSession}
                disabled={startSession.isPending}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            )}
            
            <button
              onClick={() => setShowSharedCards(true)}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              <List className="w-4 h-4" />
              Shared Cards ({sharedCards?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        <div className="lg:col-span-2 overflow-y-auto">
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

      <SharedCardsDrawer 
        isOpen={showSharedCards}
        onClose={() => setShowSharedCards(false)}
        sharedCards={sharedCards || []}
      />
    </div>
  );
}
