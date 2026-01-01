import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { TelemetryEvent } from '@/lib/types/telemetry';
import { API_BASE_URL } from '@/lib/config/api';

/**
 * TelemetryClient handles buffering and sending telemetry events to the backend.
 * It uses a batching strategy to reduce network requests and implements
 * separate transport mechanisms for regular operation vs page unload.
 */
class TelemetryClient {
  private buffer: TelemetryEvent[] = [];
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds
  private readonly BATCH_SIZE = 50;
  private flushInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushInterval();
      window.addEventListener('beforeunload', () => this.flushOnUnload());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  /**
   * Track a telemetry event.
   * Adds the event to the buffer and triggers flush if full.
   */
  public track(event: TelemetryEvent): void {
    this.buffer.push(event);

    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Start the automatic flush interval.
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Flush buffered events to the backend using Axios.
   * Handles authentication automatically via the api instance.
   */
  public async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    const eventsToSend = [...this.buffer];
    this.buffer = []; // Clear buffer immediately

    try {
      await api.post('/telemetry/batch', eventsToSend);
    } catch (error) {
      console.error('[Telemetry] Failed to flush events', error);
      // Optional: Re-queue important events or implementing offline storage (IndexedDB)
      // For MVP, we accept data loss on network failure to prevent memory leaks.
      // But we could retry once:
      // this.buffer = [...eventsToSend, ...this.buffer].slice(0, 500); // Limit buffer size
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Flush events using fetch with keepalive during unload.
   * Axios is not reliable during unload.
   */
  private flushOnUnload(): void {
    if (this.buffer.length === 0) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    const eventsToSend = this.buffer;
    const blob = new Blob([JSON.stringify(eventsToSend)], { type: 'application/json' });

    // Try Beacon API first (most reliable for simple data)
    // Note: Beacon sends as text/plain or blob type, doesn't support custom Authorizaton header easily without CORS preflight issues on some browsers.
    // However, our backend expects JSON body.
    // Standard approach: use fetch with keepalive
    
    fetch(`${API_BASE_URL}/telemetry/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventsToSend),
      keepalive: true,
    }).catch(err => {
      console.error('[Telemetry] Failed to flush on unload', err);
    });
    
    this.buffer = [];
  }
}

// Singleton instance
export const telemetryClient = new TelemetryClient();
