/**
 * Storage Service
 * 
 * SSR-safe localStorage abstraction with type safety.
 * Prevents hydration errors in Next.js by checking for window.
 */

// ========================================
// TYPES
// ========================================

/**
 * Valid storage keys (add more as needed)
 */
export type StorageKey = 
  | 'authToken'
  | 'admin_token'
  | 'userId'
  | 'promptDrawerState'
  | 'cornell-offline-queue'
  | 'pwa-install-dismissed'
  | `session_${string}`;

/**
 * Storage value types for type safety
 */
export interface StorageSchema {
  authToken: string;
  admin_token: string;
  userId: string;
  promptDrawerState: 'peek' | 'expanded' | 'collapsed';
  'cornell-offline-queue': any[]; // Offline queue items
  'pwa-install-dismissed': string; // ISO date string
}

// ========================================
// SERVICE
// ========================================

class StorageService {
  /**
   * Check if localStorage is available (SSR-safe)
   */
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Get item from storage (type-safe)
   */
  get<K extends StorageKey>(
    key: K,
    defaultValue?: K extends keyof StorageSchema ? StorageSchema[K] : any
  ): (K extends keyof StorageSchema ? StorageSchema[K] : any) | null {
    if (!this.isAvailable()) {
      return defaultValue ?? null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        // If not JSON, return as string
        return item as any;
      }
    } catch (error) {
      console.error(`[Storage] Failed to get "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in storage (type-safe)
   */
  set<K extends StorageKey>(
    key: K,
    value: K extends keyof StorageSchema ? StorageSchema[K] : any
  ): void {
    if (!this.isAvailable()) {
      console.warn('[Storage] localStorage not available (SSR)');
      return;
    }

    try {
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`[Storage] Failed to set "${key}":`, error);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: StorageKey): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Failed to remove "${key}":`, error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('[Storage] Failed to clear:', error);
    }
  }

  /**
   * Check if key exists
   */
  has(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    return Object.keys(localStorage);
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

export const storageService = new StorageService();
