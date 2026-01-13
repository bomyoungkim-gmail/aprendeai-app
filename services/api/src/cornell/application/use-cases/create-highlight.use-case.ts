import { Injectable, Inject } from "@nestjs/common";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { UsageTrackingService } from "../../../billing/usage-tracking.service";
import { ActivityService } from "../../../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateCornellHighlightDto } from "../../dto/create-cornell-highlight.dto";
import { Highlight } from "../../domain/entities/highlight.entity";
import { Environment } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class CreateHighlightUseCase {
  constructor(
    @Inject(IHighlightsRepository)
    private readonly highlightsRepository: IHighlightsRepository,
    private readonly usageTracking: UsageTrackingService,
    private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    contentId: string,
    userId: string,
    dto: CreateCornellHighlightDto,
  ): Promise<Highlight> {
    const highlight = new Highlight({
      id: crypto.randomUUID(),
      contentId,
      userId,
      kind:
        dto.kind ||
        (dto.target_type === "PDF" || dto.target_type === "IMAGE"
          ? "AREA"
          : "TEXT"),
      targetType: dto.target_type,
      type: dto.type, // Add the pedagogical type
      pageNumber: dto.page_number,
      anchor: dto.anchor_json,
      colorKey: dto.color_key,
      commentText: dto.comment_text,
      tags: dto.tags_json || [],
      timestampMs: dto.timestamp_ms,
      durationMs: dto.duration_ms,
      visibility: dto.visibility,
      visibilityScope: dto.visibility_scope,
      contextType: dto.context_type,
      contextId: dto.context_id,
      learnerId: dto.learner_id,
    });

    // Side Effects
    await this.usageTracking.trackUsage({
      scopeType: "USER",
      scopeId: userId,
      metric: "highlight_create",
      quantity: 1,
      environment: this.getEnvironment(),
    });

    await this.activityService
      .trackActivity(userId, "annotation")
      .catch(() => {});

    this.eventEmitter.emit("reading.activity", {
      userId,
      contentId,
      activityType: "highlight",
    });

    // GRAPH SCRIPT 19.10: Emit event for graph reinforcement
    this.eventEmitter.emit("highlight.created", {
      highlightId: highlight.id,
      userId,
      contentId,
      selectedText: highlight.anchor?.text || "",
    });

    return this.highlightsRepository.create(highlight);
  }

  private getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === "production") return Environment.PROD;
    if (env === "staging") return Environment.STAGING;
    return Environment.DEV;
  }
}
