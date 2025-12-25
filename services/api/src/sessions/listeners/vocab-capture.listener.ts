import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { VocabService } from "../../vocab/vocab.service";

/**
 * Listens to session events and triggers vocabulary capture
 * for MARK_UNKNOWN_WORD events using existing VocabService
 */
@Injectable()
export class VocabCaptureListener {
  private readonly logger = new Logger(VocabCaptureListener.name);

  constructor(private vocabService: VocabService) {}

  @OnEvent("session.events.created")
  async handleSessionEvents(payload: {
    sessionId: string;
    eventTypes: string[];
  }) {
    // Check if any MARK_UNKNOWN_WORD events were created
    if (payload.eventTypes.includes("MARK_UNKNOWN_WORD")) {
      this.logger.log(
        `Triggering vocab capture for session ${payload.sessionId}`,
      );

      try {
        // Reuse existing VocabService.createFromUnknownWords()
        // This method already:
        // - Reads all MARK_UNKNOWN_WORD events from the session
        // - Normalizes words
        // - Upserts to UserVocabulary
        // - Handles lastSeenAt updates
        // - Sets srsStage to NEW with dueAt = tomorrow
        const result = await this.vocabService.createFromUnknownWords(
          payload.sessionId,
        );

        this.logger.log(
          `Vocab capture complete: ${result.created} words added for session ${payload.sessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to capture vocabulary for session ${payload.sessionId}`,
          error,
        );
        // Don't throw - vocab capture failure shouldn't break the session flow
      }
    }
  }
}
