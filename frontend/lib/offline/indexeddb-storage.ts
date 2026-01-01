/**
 * IndexedDB Storage Implementation
 * 
 * Following MelhoresPraticas.txt:
 * - Infrastructure em lib/
 * - Implementa interface do domain
 * - Sem lógica de negócio
 * 
 * Provides persistent storage for offline functionality
 */

import { OfflineStorage } from './offline-manager';

export class IndexedDBStorage implements OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'cornell-reader-offline';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('annotations')) {
          db.createObjectStore('annotations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('telemetry')) {
          db.createObjectStore('telemetry', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readonly');
      const store = transaction.objectStore('meta');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readwrite');
      const store = transaction.objectStore('meta');
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readwrite');
      const store = transaction.objectStore('meta');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete entire database (for testing/reset)
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('cornell-reader-offline');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
