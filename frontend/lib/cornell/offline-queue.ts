/**
 * Offline Queue
 * 
 * Queues operations when offline and processes them when back online.
 */

export interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'UPDATE_VISIBILITY' | 'DELETE' | 'COMMENT';
  contentId: string;
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'cornell-offline-queue';
const MAX_RETRIES = 3;

class OfflineQueueClass {
  private queue: QueuedOperation[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load offline queue:', err);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.error('Failed to save offline queue:', err);
    }
  }

  add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedOp);
    this.saveQueue();
    
    console.log('📥 Queued operation:', queuedOp.type);
    return queuedOp.id;
  }

  remove(id: string) {
    this.queue = this.queue.filter((op) => op.id !== id);
    this.saveQueue();
  }

  getAll(): QueuedOperation[] {
    return [...this.queue];
  }

  async processQueue(
    executor: (operation: QueuedOperation) => Promise<void>
  ) {
    console.log(`📤 Processing ${this.queue.length} queued operations`);

    const operations = [...this.queue];

    for (const op of operations) {
      try {
        await executor(op);
        this.remove(op.id);
        console.log('✅ Processed:', op.type);
      } catch (err) {
        console.error('❌ Failed to process:', op.type, err);
        
        // Increment retries
        const index = this.queue.findIndex((o) => o.id === op.id);
        if (index !== -1) {
          this.queue[index].retries++;
          
          // Remove if max retries exceeded
          if (this.queue[index].retries > MAX_RETRIES) {
            console.warn('❌ Max retries exceeded, removing:', op.id);
            this.remove(op.id);
          } else {
            this.saveQueue();
          }
        }
      }
    }
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  get length(): number {
    return this.queue.length;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueClass();
