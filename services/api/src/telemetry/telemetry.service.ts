import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto } from './dto/track-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private eventBuffer: Prisma.telemetry_eventsCreateManyInput[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds
  private flushInterval: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
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

  /**
   * Tracks a new telemetry event.
   * Adds the event to an in-memory buffer. If buffer size exceeds BATCH_SIZE, triggers a flush.
   * This method is designed to be non-blocking and fire-and-forget from the caller's perspective,
   * though validation errors in DTO (at controller level) will block.
   * 
   * @param dto data transfer object containing event details
   * @param userId id of the authenticated user
   */
  async track(dto: TrackEventDto, userId: string): Promise<void> {
    const eventInput: Prisma.telemetry_eventsCreateManyInput = {
      user_id: userId,
      content_id: dto.contentId,
      session_id: dto.sessionId,
      event_type: dto.eventType,
      event_version: dto.eventVersion || '1.0.0',
      ui_policy_version: dto.uiPolicyVersion || null,
      mode: dto.mode || null,
      data: dto.data ? (dto.data as any) : Prisma.JsonNull, // Cast to any to satisfy Prisma Json type
      created_at: new Date(),
    };

    this.eventBuffer.push(eventInput);

    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      this.logger.debug(`Buffer full (${this.eventBuffer.length} events). Flushing...`);
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
      this.logger.debug(`Flushing ${eventsToSave.length} telemetry events to DB...`);
      
      await this.prisma.telemetry_events.createMany({
        data: eventsToSave,
        skipDuplicates: true, // Safety net
      });

      this.logger.debug('Flush complete.');
    } catch (error) {
      this.logger.error('Failed to flush telemetry events', error.stack);
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
    this.logger.log('TelemetryService destroying. Flushing remaining events...');
    clearInterval(this.flushInterval);
    await this.flush();
  }
}
