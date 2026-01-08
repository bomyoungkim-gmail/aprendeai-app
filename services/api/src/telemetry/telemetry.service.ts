import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TrackEventDto } from "./dto/track-event.dto";
import { Prisma } from "@prisma/client";

import { SanitizationService } from "./sanitization.service"; // Added

@Injectable()
export class TelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private eventBuffer: Prisma.telemetry_eventsCreateManyInput[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 10000;
  private flushInterval: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sanitizer: SanitizationService, // Injected
  ) {
    this.startFlushInterval();
  }

  /**
   * Starts the automatic flush interval
   */
  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  async track(dto: TrackEventDto, userId: string): Promise<void> {
    const scrubbedData = this.sanitizer.scrub(dto.data); // Scrub data

    // De-duplication: Check for duplicate events in last 5 seconds
    const isDuplicate = await this.isDuplicateEvent(
      userId,
      dto.eventType,
      dto.contentId,
      dto.sessionId,
    );

    if (isDuplicate) {
      this.logger.debug(
        `Duplicate event detected: ${dto.eventType} for user ${userId}. Skipping.`,
      );
      return; // Skip duplicate
    }

    const eventInput: Prisma.telemetry_eventsCreateManyInput = {
      user_id: userId,
      content_id: dto.contentId,
      session_id: dto.sessionId,
      event_type: dto.eventType,
      event_version: dto.eventVersion || "1.0.0",
      ui_policy_version: dto.uiPolicyVersion || null,
      mode: dto.mode || null,
      data: scrubbedData ? (scrubbedData as any) : Prisma.JsonNull, // Use scrubbed data
      created_at: new Date(),
    };

    this.eventBuffer.push(eventInput);

    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      this.logger.debug(
        `Buffer full (${this.eventBuffer.length} events). Flushing...`,
      );
      await this.flush(); // Await here to ensure backpressure if needed, though caller ignores it mostly
    }
  }

  /**
   * Flushes the current event buffer to the database in a single batch transaction.
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToSave = [...this.eventBuffer];
    this.eventBuffer = []; // Clear buffer immediately to avoid double processing

    try {
      this.logger.debug(
        `Flushing ${eventsToSave.length} telemetry events to DB...`,
      );

      await this.prisma.telemetry_events.createMany({
        data: eventsToSave,
        skipDuplicates: true, // Safety net
      });

      this.logger.debug("Flush complete.");
    } catch (error) {
      this.logger.error("Failed to flush telemetry events", error.stack);
      // Strategy: Re-queue failed events?
      // For telemetry, we often drop data rather than risk memory leaks or crash.
      // But for critical analytics, we might retry.
      // Decision: Drop and log for Sprint 1. MVP.
      // To improve: Add to a DLQ or retry buffer with limit.
    }
  }

  /**
   * Ensures all buffered events are saved before the application shuts down.
   */
  async onModuleDestroy() {
    this.logger.log(
      "TelemetryService destroying. Flushing remaining events...",
    );
    clearInterval(this.flushInterval);
    await this.flush();
  }

  /**
   * Check if event is a duplicate (within 5-second window)
   */
  private async isDuplicateEvent(
    userId: string,
    eventType: string,
    contentId: string,
    sessionId: string,
  ): Promise<boolean> {
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const existingEvent = await this.prisma.telemetry_events.findFirst({
      where: {
        user_id: userId,
        event_type: eventType,
        content_id: contentId,
        session_id: sessionId,
        created_at: {
          gte: fiveSecondsAgo,
        },
      },
    });

    return !!existingEvent;
  }

  /**
   * Retrieves basic statistics for a specific content.
   * Returns the count of events grouped by event type.
   */
  async getStats(contentId: string) {
    // Flush buffer first to include recent events in stats
    await this.flush();

    const stats = await this.prisma.telemetry_events.groupBy({
      by: ["event_type"],
      where: {
        content_id: contentId,
      },
      _count: {
        event_type: true,
      },
    });

    // Format as { VIEW_CONTENT: 10, SCROLL: 50, ... }
    const result: Record<string, number> = {};
    stats.forEach((item) => {
      result[item.event_type] = item._count.event_type;
    });

    return result;
  }
}
