'use client';

import { GroupSession } from '@/lib/types/study-groups';
import { RoundPanel } from './RoundPanel';
import { ReferencePanel } from './ReferencePanel';
import { SharedCardsDrawer } from './SharedCardsDrawer';
import { MobileTabBar } from './MobileTabBar';
import { RoundNavigator } from './RoundNavigator';
import { useSprintInterface } from '@/hooks/study-groups/use-sprint-interface';
import { SprintTopBar } from './sprint-interface';

interface PISprintInterfaceProps {
  session: GroupSession;
}

export function PISprintInterface({ session }: PISprintInterfaceProps) {
  const {
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
    isStarting,
    
    // Handlers
    handleStartSession,
    handleAdvanceRound,
    getRoleColor,
  } = useSprintInterface(session);

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* TopBar - Responsive */}
      <SprintTopBar
        session={session}
        currentRoundIndex={currentRoundIndex}
        currentRound={currentRound}
        myRole={mySessionMember?.assignedRole}
        connectionStatus={connectionStatus}
        connectionColor={connectionColor}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        reconnectAttempts={reconnectAttempts}
        timeFormatted={timeFormatted}
        isExpired={isExpired}
        onStartSession={handleStartSession}
        onShowSharedCards={() => setShowSharedCards(true)}
        sharedCardsCount={sharedCards?.length || 0}
        getRoleColor={getRoleColor}
        isStarting={isStarting}
      />

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
