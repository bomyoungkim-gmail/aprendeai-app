/**
 * Offline Sync Hook
 * 
 * Auto-syncs queued operations when coming back online.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '../use-online-status';
import { offlineQueue, type QueuedOperation } from '@/lib/cornell/offline-queue';
import { useApiClient } from '../use-api-client';
import { cornellKeys } from './use-cornell-highlights';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!isOnline || isSyncing.current) return;
    if (offlineQueue.length === 0) return;

    const syncQueue = async () => {
      isSyncing.current = true;
      console.log('🔄 Starting offline sync...');

      await offlineQueue.processQueue(async (operation: QueuedOperation) => {
        const { type, contentId, payload } = operation;

        switch (type) {
          case 'CREATE':
            await api.post(`/cornell/contents/${contentId}/highlights`, payload);
            break;

          case 'UPDATE_VISIBILITY':
            await api.patch(
              `/cornell/highlights/${payload.highlightId}/visibility`,
              payload.data
            );
            break;

          case 'DELETE':
            await api.delete(`/cornell/highlights/${payload.highlightId}`);
            break;

          case 'COMMENT':
            await api.post(
              `/cornell/highlights/${payload.highlightId}/comments`,
              { text: payload.text }
            );
            break;

          default:
            console.warn('Unknown operation type:', type);
        }

        // Invalidate cache for this content
        queryClient.invalidateQueries({
          queryKey: cornellKeys.list(contentId),
        });
      });

      isSyncing.current = false;
      console.log('✅ Offline sync complete');
    };

    syncQueue().catch((err) => {
      console.error('❌ Offline sync failed:', err);
      isSyncing.current = false;
    });
  }, [isOnline, api, queryClient]);

  return {
    isOnline,
    queueLength: offlineQueue.length,
    isSyncing: isSyncing.current,
  };
}
