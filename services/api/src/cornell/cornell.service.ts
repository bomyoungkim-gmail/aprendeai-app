import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { ActivityService } from "../activity/activity.service";
import {
  CreateHighlightDto,
  UpdateCornellDto,
  UpdateHighlightDto,
} from "./dto/cornell.dto";
import { Environment } from "@prisma/client";

@Injectable()
export class CornellService {
  constructor(
    private prisma: PrismaService,
    private usageTracking: UsageTrackingService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
  ) {}

  private getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === "production") return Environment.PROD;
    if (env === "staging") return Environment.STAGING;
    return Environment.DEV;
  }

  async getMyContents(userId: string) {
    return this.prisma.content.findMany({
      where: {
        OR: [
          { ownerUserId: userId },
          {
            creator: {
              id: userId,
            },
          },
        ],
      },
      include: {
        file: {
          select: {
            id: true,
            mimeType: true,
            originalFilename: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getContent(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { file: true },
    });

    if (!content) throw new NotFoundException("Content not found");

    // Simple ownership check - expand for institution sharing logic later
    if (content.ownerUserId !== userId) {
      // Allow if admin or institution match (stub)
    }

    return content;
  }

  async getOrCreateCornellNotes(contentId: string, userId: string) {
    let notes = await this.prisma.cornellNotes.findUnique({
      where: { contentId_userId: { contentId, userId } },
    });

    if (!notes) {
      notes = await this.prisma.cornellNotes.create({
        data: {
          contentId,
          userId,
          cuesJson: [],
          notesJson: [],
          summaryText: "",
        },
      });
    }

    return notes;
  }

  async updateCornellNotes(
    contentId: string,
    dto: UpdateCornellDto,
    userId: string,
  ) {
    const notes = await this.getOrCreateCornellNotes(contentId, userId);

    await this.usageTracking.trackUsage({
      scopeType: "USER",
      scopeId: userId,
      metric: "cornell_note_save", // Make sure this metric exists in usage tracking logic or ignored
      quantity: 1,
      environment: this.getEnvironment(),
    });

    // Track activity: updating Cornell notes
    await this.activityService.trackActivity(userId, 'annotation').catch(() => {});

    // Emit reading activity for Study Session tracking
    this.eventEmitter.emit('reading.activity', {
      userId,
      contentId,
      activityType: 'annotation',
    });

    return this.prisma.cornellNotes.update({
      where: { id: notes.id },
      data: {
        cuesJson: dto.cues_json ?? undefined,
        notesJson: dto.notes_json ?? undefined,
        summaryText: dto.summary_text ?? undefined,
        updatedAt: new Date(),
      },
    });
  }

  async getHighlights(contentId: string, userId: string) {
    return this.prisma.highlight.findMany({
      where: { contentId, userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createHighlight(
    contentId: string,
    dto: CreateHighlightDto,
    userId: string,
  ) {
    await this.usageTracking.trackUsage({
      scopeType: "USER",
      scopeId: userId,
      metric: "highlight_create",
      quantity: 1,
      environment: this.getEnvironment(),
    });

    // Track activity: creating highlight
    await this.activityService.trackActivity(userId, 'annotation').catch(() => {});

    // Emit reading activity for Study Session tracking
    this.eventEmitter.emit('reading.activity', {
      userId,
      contentId,
      activityType: 'highlight',
    });

    return this.prisma.highlight.create({
      data: {
        contentId,
        userId,
        kind: dto.kind,
        targetType: dto.target_type as any, // Enum mapping needed
        pageNumber: dto.page_number,
        anchorJson: dto.anchor_json,
        colorKey: dto.color_key,
        commentText: dto.comment_text,
        tagsJson: dto.tags_json || [],
      },
    });
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto, userId: string) {
    const highlight = await this.prisma.highlight.findUnique({ where: { id } });
    if (!highlight || highlight.userId !== userId)
      throw new ForbiddenException();

    return this.prisma.highlight.update({
      where: { id },
      data: {
        colorKey: dto.color_key,
        commentText: dto.comment_text,
        tagsJson: dto.tags_json,
        updatedAt: new Date(),
      },
    });
  }

  async deleteHighlight(id: string, userId: string) {
    const highlight = await this.prisma.highlight.findUnique({ where: { id } });
    if (!highlight || highlight.userId !== userId)
      throw new ForbiddenException();

    return this.prisma.highlight.delete({ where: { id } });
  }
}
