import { Injectable, Inject } from "@nestjs/common";
import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { UsageTrackingService } from "../../../billing/usage-tracking.service";
import { ActivityService } from "../../../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UpdateCornellDto } from "../../dto/cornell.dto";
import { CornellNote } from "../../domain/entities/cornell-note.entity";
import { Environment } from "@prisma/client";

@Injectable()
export class UpdateCornellNoteUseCase {
  constructor(
    @Inject(ICornellRepository)
    private readonly cornellRepository: ICornellRepository,
    private readonly usageTracking: UsageTrackingService,
    private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    contentId: string,
    userId: string,
    dto: UpdateCornellDto,
  ): Promise<CornellNote> {
    const note = await this.cornellRepository.findByContentAndUser(
      contentId,
      userId,
    );

    if (!note) {
      // Should exist or create? Service logic called getOrCreate first.
      // We'll throw or create. Let's create to be robust.
      // But we can't inject another Use Case easily without circulars sometimes.
      // We'll replicate creation or assume caller handles it.
      // Original service called getOrCreate.
      // Let's assume it exists or fail? Existing service ensures it.
      throw new Error("Cornell note not found. Use getOrCreate first.");
    }

    // Side Effects
    await this.usageTracking.trackUsage({
      scopeType: "USER",
      scopeId: userId,
      metric: "cornell_note_save",
      quantity: 1,
      environment: this.getEnvironment(),
    });

    await this.activityService
      .trackActivity(userId, "annotation")
      .catch(() => {});

    this.eventEmitter.emit("reading.activity", {
      userId,
      contentId,
      activityType: "annotation",
    });

    // Detect changes and emit granular events
    const summaryChanged =
      dto.summary_text !== undefined && dto.summary_text !== note.summary;
    const notesChanged =
      dto.notes_json !== undefined &&
      JSON.stringify(dto.notes_json) !== JSON.stringify(note.notes);

    // Update Domain Entity
    note.notes = dto.notes_json ?? note.notes;
    note.summary = dto.summary_text ?? note.summary;

    // Emit specific events for Cornell triggers
    if (summaryChanged && note.summary && note.summary.length > 0) {
      this.eventEmitter.emit("cornell.summary.updated", {
        contentId,
        userId,
        timestamp: Date.now(),
        data: {
          summaryLength: note.summary.length,
          rubricSelfCheck: dto.summary_text ? undefined : null, // Future: extract from DTO
        },
      });
    }

    if (notesChanged && dto.notes_json) {
      // Detect added cues/notes (simple heuristic: array length increased)
      const previousLength = note.notes?.length || 0;
      const newLength = dto.notes_json.length;

      if (newLength > previousLength) {
        const addedItems = dto.notes_json.slice(previousLength);
        addedItems.forEach((item: any) => {
          if (item.type === "cue" || item.cue) {
            this.eventEmitter.emit("cornell.cue.added", {
              contentId,
              userId,
              timestamp: Date.now(),
              data: {
                cueType: item.type || "general",
                length: item.text?.length || item.cue?.length || 0,
              },
            });
          } else {
            this.eventEmitter.emit("cornell.note.added", {
              contentId,
              userId,
              timestamp: Date.now(),
              data: {
                noteType: item.type || "general",
                length: item.text?.length || item.note?.length || 0,
              },
            });
          }
        });
      }
    }

    return this.cornellRepository.update(note);
  }

  private getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === "production") return Environment.PROD;
    if (env === "staging") return Environment.STAGING;
    return Environment.DEV;
  }
}
