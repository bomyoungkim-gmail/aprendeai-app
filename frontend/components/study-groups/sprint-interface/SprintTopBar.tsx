import React from 'react';
import { Timer, Play, List, Wifi, WifiOff } from 'lucide-react';
import { GroupSession, GroupRound } from '@/lib/types/study-groups';

interface SprintTopBarProps {
  session: GroupSession;
  currentRoundIndex: number;
  currentRound: GroupRound | undefined;
  myRole: string | undefined;
  connectionStatus: string;
  connectionColor: string;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  timeFormatted: string;
  isExpired: boolean;
  onStartSession: () => void;
  onShowSharedCards: () => void;
  sharedCardsCount: number;
  getRoleColor: (role: string) => string;
  isStarting: boolean;
}

export function SprintTopBar({
  session,
  currentRoundIndex,
  currentRound,
  myRole,
  connectionStatus,
  connectionColor,
  isConnected,
  isReconnecting,
  reconnectAttempts,
  timeFormatted,
  isExpired,
  onStartSession,
  onShowSharedCards,
  sharedCardsCount,
  getRoleColor,
  isStarting,
}: SprintTopBarProps) {
  return (
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
          {myRole && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600">You are:</span>
              <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-medium ${getRoleColor(myRole)}`}>
                {myRole}
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
              onClick={onStartSession}
              disabled={isStarting}
              className="flex items-center gap-1 md:gap-2 bg-green-600 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-xs md:text-sm"
            >
              <Play className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Start</span>
            </button>
          )}
          
          {/* Shared Cards Button - Desktop only */}
          <button
            onClick={onShowSharedCards}
            className="hidden lg:flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
          >
            <List className="w-4 h-4" />
            Shared Cards ({sharedCardsCount})
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
        {myRole && (
          <span className={`px-2 py-1 rounded text-xs ${getRoleColor(myRole)}`}>
            {myRole}
          </span>
        )}
      </div>
    </div>
  );
}
