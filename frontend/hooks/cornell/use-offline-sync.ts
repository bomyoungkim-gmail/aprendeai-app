import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/shared/use-online-status';
import { offlineQueue, type QueuedOperation } from '@/lib/cornell/offline-queue';
import { cornellApi } from '@/lib/api/cornell';
import { cornellKeys } from './use-cornell-highlights';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);
  const [queueLength, setQueueLength] = useState(() => offlineQueue.length);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(() => {
      setQueueLength(offlineQueue.length);
    });
    return () => { unsubscribe(); };
  }, []);

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
            await cornellApi.createHighlight(contentId, payload);
            break;

          case 'UPDATE_VISIBILITY':
            await cornellApi.updateHighlightVisibility(
              contentId,
              payload.highlightId,
              payload.data
            );
            break;

          case 'DELETE':
            await cornellApi.deleteHighlight(payload.highlightId);
            break;

          case 'COMMENT':
            await cornellApi.updateHighlight(
              payload.highlightId,
              { comment_text: payload.text }
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
  }, [isOnline, queryClient, queueLength]); // Depend on queueLength to retry sync if new items added

  return {
    isOnline,
    queueLength,
    isSyncing: isSyncing.current,
  };
}
