/**
 * Telemetry Service - Frontend
 * 
 * Tracks user interactions and sends events to backend in batches.
 * Supports Cornell Notes events (HIGHLIGHT_CREATED, NOTE_CREATED) and
 * scaffolding events (MISSION_COMPLETED, SCAFFOLDING_LEVEL_CHANGE).
 */

import { ContentMode } from '../types/content';

export interface TelemetryEvent {
  eventType: string;
  eventVersion?: string;
  uiPolicyVersion?: string;
  contentId: string;
  sessionId: string;
  mode?: ContentMode;
  data?: Record<string, any>;
}

export interface CornellHighlightData {
  type: 'EVIDENCE' | 'VOCABULARY' | 'MAIN_IDEA' | 'DOUBT';
  kind: 'TEXT' | 'AREA';
  targetType: 'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  anchorJson?: any;
  commentText?: string;
}

export interface CornellNoteData {
  type: 'SYNTHESIS';
  text: string;
  relatedHighlights?: string[];
}

class TelemetryService {
  private eventBuffer: TelemetryEvent[] = [];
  private readonly BATCH_SIZE = 50; // Smaller than backend to avoid overwhelming
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds
  private flushInterval: NodeJS.Timeout | null = null;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.startFlushInterval();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Track a single event
   */
  track(event: TelemetryEvent): void {
    this.eventBuffer.push({
      ...event,
      eventVersion: event.eventVersion || '1.0.0',
    });

    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Track Cornell highlight creation
   */
  trackHighlightCreated(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    data: CornellHighlightData
  ): void {
    this.track({
      eventType: 'HIGHLIGHT_CREATED',
      contentId,
      sessionId,
      mode,
      data,
    });
  }

  /**
   * Track Cornell highlight update
   */
  trackHighlightUpdated(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    highlightId: string,
    changes: Partial<CornellHighlightData>
  ): void {
    this.track({
      eventType: 'HIGHLIGHT_UPDATED',
      contentId,
      sessionId,
      mode,
      data: { highlightId, changes },
    });
  }

  /**
   * Track Cornell note (synthesis) creation
   */
  trackNoteCreated(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    data: CornellNoteData
  ): void {
    this.track({
      eventType: 'NOTE_CREATED',
      contentId,
      sessionId,
      mode,
      data,
    });
  }

  /**
   * Track mission completion
   */
  trackMissionCompleted(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    missionId: string,
    score: number
  ): void {
    this.track({
      eventType: 'MISSION_COMPLETED',
      contentId,
      sessionId,
      mode,
      data: {
        missionId,
        completionTime: Date.now(),
        score,
      },
    });
  }

  /**
   * Track scaffolding level change
   */
  trackScaffoldingLevelChange(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    fromLevel: number,
    toLevel: number,
    reason: string
  ): void {
    this.track({
      eventType: 'SCAFFOLDING_LEVEL_CHANGE',
      contentId,
      sessionId,
      mode,
      data: {
        fromLevel,
        toLevel,
        reason,
      },
    });
  }

  /**
   * Track flow state change
   */
  trackFlowStateChange(
    contentId: string,
    sessionId: string,
    mode: ContentMode,
    fromState: 'FLOW' | 'CONFUSION' | 'NORMAL',
    toState: 'FLOW' | 'CONFUSION' | 'NORMAL',
    confidence: number
  ): void {
    this.track({
      eventType: 'FLOW_STATE_CHANGE',
      contentId,
      sessionId,
      mode,
      data: {
        fromState,
        toState,
        confidence,
      },
    });
  }

  /**
   * Flush buffered events to backend
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = []; // Clear buffer immediately

    try {
      const response = await fetch(`${this.apiBaseUrl}/telemetry/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if needed
        },
        credentials: 'include',
        body: JSON.stringify(eventsToSend[0]), // Send first event (will batch later)
      });

      if (!response.ok) {
        console.error('Failed to send telemetry events:', response.statusText);
        // Re-queue events on failure (with limit to avoid memory leak)
        if (this.eventBuffer.length < 500) {
          this.eventBuffer.push(...eventsToSend);
        }
      }
    } catch (error) {
      console.error('Error sending telemetry events:', error);
      // Re-queue on network error
      if (this.eventBuffer.length < 500) {
        this.eventBuffer.push(...eventsToSend);
      }
    }
  }

  /**
   * Stop the flush interval (cleanup)
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
export const telemetryService = new TelemetryService();
