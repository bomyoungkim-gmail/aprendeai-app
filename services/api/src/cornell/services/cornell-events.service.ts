/**
 * Cornell Events Service
 *
 * Normalizes internal Cornell events to structured telemetry_events.
 * Follows Clean Architecture: Application layer service.
 */

import { Injectable, OnModuleInit } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { CornellEvent, CornellEventPayload } from "../events/cornell.events";

@Injectable()
export class CornellEventsService implements OnModuleInit {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly telemetryService: TelemetryService,
  ) {}

  onModuleInit() {
    // Service is ready to listen to events
  }

  /**
   * Normalize cornell_highlight_created
   * Payload: { contentId, highlightId, pillarTag, pageNumber, hasAnchor }
   */
  @OnEvent(CornellEvent.ANNOTATION_CREATED)
  async handleHighlightCreated(payload: CornellEventPayload) {
    const { contentId, highlightId, userId, data } = payload;

    await this.telemetryService.track(
      {
        eventType: "cornell_highlight_created",
        eventVersion: "1.0.0",
        sessionId: data?.sessionId || "unknown",
        contentId,
        data: {
          highlightId,
          pillarTag: data?.type || data?.pillarTag,
          pageNumber: data?.pageNumber,
          hasAnchor: data?.hasAnchor ?? false,
          targetType: data?.targetType,
        },
      },
      userId,
    );
  }

  /**
   * Normalize cornell_summary_submitted
   * Payload: { contentId, summaryLen, rubricSelfCheck? }
   */
  @OnEvent(CornellEvent.SUMMARY_UPDATED)
  async handleSummaryUpdated(payload: CornellEventPayload) {
    const { contentId, userId, data } = payload;

    await this.telemetryService.track(
      {
        eventType: "cornell_summary_submitted",
        eventVersion: "1.0.0",
        sessionId: data?.sessionId || "unknown",
        contentId,
        data: {
          summaryLen: data?.summaryLength || 0,
          rubricSelfCheck: data?.rubricSelfCheck,
        },
      },
      userId,
    );
  }

  /**
   * Normalize cornell_cue_added
   * Payload: { contentId, cueType, length }
   */
  @OnEvent(CornellEvent.CUE_ADDED)
  async handleCueAdded(payload: CornellEventPayload) {
    const { contentId, userId, data } = payload;

    await this.telemetryService.track(
      {
        eventType: "cornell_cue_added",
        eventVersion: "1.0.0",
        sessionId: data?.sessionId || "unknown",
        contentId,
        data: {
          cueType: data?.cueType || "general",
          length: data?.length || 0,
        },
      },
      userId,
    );
  }

  /**
   * Normalize cornell_note_added
   * Payload: { contentId, noteType, length }
   */
  @OnEvent(CornellEvent.NOTE_ADDED)
  async handleNoteAdded(payload: CornellEventPayload) {
    const { contentId, userId, data } = payload;

    await this.telemetryService.track(
      {
        eventType: "cornell_note_added",
        eventVersion: "1.0.0",
        sessionId: data?.sessionId || "unknown",
        contentId,
        data: {
          noteType: data?.noteType || "general",
          length: data?.length || 0,
        },
      },
      userId,
    );
  }

  /**
   * Normalize cornell_checkpoint_answered (future)
   * Payload: { contentId, correct, checkpointId }
   */
  @OnEvent(CornellEvent.CHECKPOINT_ANSWERED)
  async handleCheckpointAnswered(payload: CornellEventPayload) {
    const { contentId, userId, data } = payload;

    await this.telemetryService.track(
      {
        eventType: "cornell_checkpoint_answered",
        eventVersion: "1.0.0",
        sessionId: data?.sessionId || "unknown",
        contentId,
        data: {
          correct: data?.correct ?? false,
          checkpointId: data?.checkpointId,
        },
      },
      userId,
    );
  }
}
