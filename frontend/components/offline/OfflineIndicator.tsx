/**
 * Offline Indicator Component
 * 
 * Following MelhoresPraticas.txt:
 * - UI component apenas
 * - Sem lógica de negócio
 * - Props para dados e callbacks
 * 
 * Displays offline status and pending sync count
 */

import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
}

export function OfflineIndicator({
  isOnline,
  pendingCount,
  isSyncing,
  onManualSync
}: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0) {
    return null; // Hide when online and nothing to sync
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
        isOnline 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-800 text-white'
      }`}>
        {isOnline ? (
          <Cloud className="w-5 h-5" />
        ) : (
          <CloudOff className="w-5 h-5" />
        )}

        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {pendingCount > 0 && (
          <>
            <span className="text-sm">
              · {pendingCount} {pendingCount === 1 ? 'item' : 'itens'} pendente{pendingCount === 1 ? '' : 's'}
            </span>

            {isOnline && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="ml-2 p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                aria-label="Sincronizar agora"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
