/**
 * Cornell Notes Storage Manager
 * Handles offline-first persistence with chrome.storage.local
 */

interface CornellNote {
  id?: string;
  type: string;
  text: string;
  url: string;
  context?: any;
  createdAt: Date;
  synced: boolean;
}

interface StorageData {
  pendingNotes: CornellNote[];
  cachedNotes: { [url: string]: CornellNote[] };
}

export class CornellStorage {
  private static STORAGE_KEY = 'cornell_notes';
  
  /**
   * Save note to local storage (pending sync)
   */
  static async savePendingNote(note: Omit<CornellNote, 'id' | 'createdAt' | 'synced'>): Promise<void> {
    const storage = await this.getStorage();
    
    const newNote: CornellNote = {
      ...note,
      id: `temp_${Date.now()}`,
      createdAt: new Date(),
      synced: false,
    };
    
    storage.pendingNotes.push(newNote);
    
    // Also add to cache for immediate display
    if (!storage.cachedNotes[note.url]) {
      storage.cachedNotes[note.url] = [];
    }
    storage.cachedNotes[note.url].push(newNote);
    
    await this.setStorage(storage);
  }
  
  /**
   * Get all pending notes (not yet synced)
   */
  static async getPendingNotes(): Promise<CornellNote[]> {
    const storage = await this.getStorage();
    return storage.pendingNotes;
  }
  
  /**
   * Mark note as synced and update with server ID
   */
  static async markSynced(tempId: string, serverId: string): Promise<void> {
    const storage = await this.getStorage();
    
    // Update in pending notes
    const noteIndex = storage.pendingNotes.findIndex(n => n.id === tempId);
    if (noteIndex !== -1) {
      storage.pendingNotes.splice(noteIndex, 1);
    }
    
    // Update in cached notes
    for (const url in storage.cachedNotes) {
      const cachedIndex = storage.cachedNotes[url].findIndex(n => n.id === tempId);
      if (cachedIndex !== -1) {
        storage.cachedNotes[url][cachedIndex].id = serverId;
        storage.cachedNotes[url][cachedIndex].synced = true;
      }
    }
    
    await this.setStorage(storage);
  }
  
  /**
   * Cache notes from server for a specific URL
   */
  static async cacheNotes(url: string, notes: CornellNote[]): Promise<void> {
    const storage = await this.getStorage();
    
    storage.cachedNotes[url] = notes.map(n => ({
      ...n,
      synced: true,
    }));
    
    await this.setStorage(storage);
  }
  
  /**
   * Get cached notes for URL (includes pending + synced)
   */
  static async getCachedNotes(url: string): Promise<CornellNote[]> {
    const storage = await this.getStorage();
    return storage.cachedNotes[url] || [];
  }
  
  /**
   * Clear all cached data (for logout)
   */
  static async clear(): Promise<void> {
    await chrome.storage.local.remove(this.STORAGE_KEY);
  }
  
  /**
   * Get storage data
   */
  private static async getStorage(): Promise<StorageData> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    return result[this.STORAGE_KEY] || {
      pendingNotes: [],
      cachedNotes: {},
    };
  }
  
  /**
   * Set storage data
   */
  private static async setStorage(data: StorageData): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
  }
}

/**
 * Cornell Sync Manager
 * Automatically syncs pending notes when online
 */
export class CornellSync {
  private static isSyncing = false;
  
  /**
   * Sync all pending notes to server
   */
  static async syncPendingNotes(apiClient: any): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      const pendingNotes = await CornellStorage.getPendingNotes();
      
      for (const note of pendingNotes) {
        try {
          const response = await apiClient.createCornellNote({
            type: note.type,
            text: note.text,
            url: note.url,
            context: note.context,
          });
          
          // Mark as synced
          await CornellStorage.markSynced(note.id!, response.id);
          
          console.log(`[Cornell Sync] Synced note ${note.id} -> ${response.id}`);
        } catch (error) {
          console.error(`[Cornell Sync] Failed to sync note ${note.id}:`, error);
          // Continue with other notes
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Start periodic sync (every 30 seconds)
   */
  static startPeriodicSync(apiClient: any): void {
    setInterval(() => {
      this.syncPendingNotes(apiClient);
    }, 30000); // 30 seconds
  }
}
