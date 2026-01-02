/**
 * Offline Sync Hook
 * 
 * Following MelhoresPraticas.txt:
 * - Hooks em hooks/ para orquestração
 * - Gerencia React state e side effects
 * - Usa domain logic puro (OfflineManager)
 * - Sem regras de negócio aqui
 * 
 * I2.1: Save offline
 * I2.2: Auto-sync when online
 */

import { useEffect, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OfflineManager } from '@/lib/offline/offline-manager';
import { IndexedDBStorage } from '@/lib/offline/indexeddb-storage';
import api from '@/services/api';

// Singleton instances
const storage = new IndexedDBStorage();
const offlineManager = new OfflineManager(storage);

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    storage.init()
      .then(() => offlineManager.loadQueue())
      .then(() => {
        setPendingCount(offlineManager.getPendingCount());
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize offline storage:', error);
        toast.error('Erro ao inicializar armazenamento offline');
      });

    // Cleanup on unmount
    return () => {
      storage.close();
    };
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Auto-sync when coming online
      if (pendingCount > 0) {
        syncMutation.mutate();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('Você está offline. Alterações serão sincronizadas quando voltar online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount]);

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await offlineManager.sync(api);
    },
    onSuccess: ({ success, failed }) => {
      setPendingCount(offlineManager.getPendingCount());

      if (success > 0) {
        toast.success(`${success} ${success === 1 ? 'item sincronizado' : 'itens sincronizados'}`);
      }
      if (failed > 0) {
        toast.error(`${failed} ${failed === 1 ? 'item falhou' : 'itens falharam'} na sincronização`);
      }
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar dados');
    }
  });

  // Save offline
  const saveOffline = useCallback(async (
    entity: 'annotation' | 'telemetry' | 'progress',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    if (!isInitialized) {
      console.warn('Offline storage not initialized yet');
      return;
    }

    try {
      await offlineManager.saveOffline(entity, action, data);
      setPendingCount(offlineManager.getPendingCount());
      
      if (!isOnline) {
        toast.info('Salvo offline. Será sincronizado quando voltar online.');
      }
    } catch (error) {
      console.error('Failed to save offline:', error);
      toast.error('Erro ao salvar offline');
    }
  }, [isInitialized, isOnline]);

  // Manual sync
  const manualSync = useCallback(() => {
    if (!isOnline) {
      toast.warning('Você está offline');
      return;
    }

    if (pendingCount === 0) {
      toast.info('Nada para sincronizar');
      return;
    }

    syncMutation.mutate();
  }, [isOnline, pendingCount, syncMutation]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineManager.clearAll();
      setPendingCount(0);
      toast.success('Dados offline limpos');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      toast.error('Erro ao limpar dados offline');
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    isInitialized,
    saveOffline,
    manualSync,
    clearOfflineData,
    isSyncing: syncMutation.isPending
  };
}
