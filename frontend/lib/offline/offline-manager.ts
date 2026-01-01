/**
 * Offline Manager - Domain Logic
 * 
 * Following MelhoresPraticas.txt:
 * - Domain logic em lib/
 * - Sem dependências de framework
 * - Funções puras quando possível
 * - Type-safe interfaces
 * 
 * I2.1: Save entities offline
 * I2.2: Sync when online
 */

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'annotation' | 'telemetry' | 'progress';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  getAll(storeName: string): Promise<any[]>;
}

export class OfflineManager {
  private storage: OfflineStorage;
  private syncQueue: SyncQueueItem[] = [];

  constructor(storage: OfflineStorage) {
    this.storage = storage;
  }

  /**
   * I2.1: Save entity offline
   */
  async saveOffline(
    entity: 'annotation' | 'telemetry' | 'progress',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    const id = `${entity}-${data.id || Date.now()}`;

    // Save to local storage
    await this.storage.set(id, data);

    // Add to sync queue
    this.syncQueue.push({
      id,
      action,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Persist queue
    await this.storage.set('sync-queue', this.syncQueue);
  }

  /**
   * I2.2: Sync when online
   */
  async sync(apiClient: any): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;
    const remaining: SyncQueueItem[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item, apiClient);
        success++;

        // Remove from local storage after successful sync
        await this.storage.delete(item.id);
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);

        // Retry logic (max 3 attempts)
        if (item.retryCount < 3) {
          remaining.push({
            ...item,
            retryCount: item.retryCount + 1
          });
        } else {
          failed++;
        }
      }
    }

    this.syncQueue = remaining;
    await this.storage.set('sync-queue', this.syncQueue);

    return { success, failed };
  }

  private async syncItem(item: SyncQueueItem, apiClient: any): Promise<void> {
    const endpoint = `/${item.entity}s`;

    switch (item.action) {
      case 'CREATE':
        await apiClient.post(endpoint, item.data);
        break;
      case 'UPDATE':
        await apiClient.put(`${endpoint}/${item.data.id}`, item.data);
        break;
      case 'DELETE':
        await apiClient.delete(`${endpoint}/${item.data.id}`);
        break;
    }
  }

  /**
   * Get pending sync count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Load queue from storage
   */
  async loadQueue(): Promise<void> {
    const queue = await this.storage.get('sync-queue');
    this.syncQueue = queue || [];
  }

  /**
   * Clear all offline data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    for (const item of this.syncQueue) {
      await this.storage.delete(item.id);
    }
    this.syncQueue = [];
    await this.storage.set('sync-queue', []);
  }
}
