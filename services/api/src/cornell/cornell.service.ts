import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { ActivityService } from "../activity/activity.service";
import { TopicMasteryService } from "../analytics/topic-mastery.service";
import { ContentAccessService } from "./services/content-access.service";
import type { UpdateCornellDto, CreateHighlightDto, UpdateHighlightDto } from "./dto/cornell.dto";
import { Environment } from "@prisma/client";

@Injectable()
export class CornellService {
  constructor(
    private prisma: PrismaService,
    private usageTracking: UsageTrackingService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
    private contentAccessService: ContentAccessService,
  ) {}

  private getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === "production") return Environment.PROD;
    if (env === "staging") return Environment.STAGING;
    return Environment.DEV;
  }

  async getMyContents(userId: string) {
    const contents = await this.prisma.content.findMany({
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
            sizeBytes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert BigInt to number for JSON serialization
    return contents.map(content => ({
      ...content,
      contentType: content.type, // Frontend expects contentType
      file: content.file ? {
        ...content.file,
        sizeBytes: content.file.sizeBytes ? Number(content.file.sizeBytes) : undefined,
      } : null,
    }));
  }

  async getContent(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { file: true },
    });

    if (!content) throw new NotFoundException("Content not found");

    // Security: Robust permission check
    const canAccess = await this.contentAccessService.canAccessContent(
      contentId,
      userId,
    );

    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this content.',
      );
    }

    // Convert BigInt to number for JSON serialization
    if (content.file && content.file.sizeBytes) {
      const result = {
        ...content,
        contentType: content.type, // Frontend expects contentType
        file: {
          ...content.file,
          sizeBytes: Number(content.file.sizeBytes),
          viewUrl: `/api/v1/files/${content.file.id}/view`, // Add viewUrl for frontend
        },
      };
      return result;
    }

    return {
      ...content,
      contentType: content.type, // Frontend expects contentType
      file: content.file ? {
        ...content.file,
        viewUrl: `/api/v1/files/${content.file.id}/view`,
      } : null,
    };
  }

  async deleteContent(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, ownerUserId: true, createdBy: true },
    });

    if (!content) throw new NotFoundException("Content not found");

    // Only owner can delete
    if (content.ownerUserId !== userId && content.createdBy !== userId) {
      throw new ForbiddenException(
        'Only the content owner can delete this content.',
      );
    }

    // Delete content (cascades to highlights, cornell notes via Prisma)
    await this.prisma.content.delete({
      where: { id: contentId },
    });

    return { success: true, message: 'Content deleted successfully' };
  }

  async bulkDeleteContents(contentIds: string[], userId: string) {
    if (!contentIds || contentIds.length === 0) {
      throw new BadRequestException('No content IDs provided');
    }

    // Fetch all contents and verify ownership
    const contents = await this.prisma.content.findMany({
      where: { id: { in: contentIds } },
      select: { id: true, ownerUserId: true, createdBy: true },
    });

    // Filter only contents owned by user
    const ownedContentIds = contents
      .filter(c => c.ownerUserId === userId || c.createdBy === userId)
      .map(c => c.id);

    if (ownedContentIds.length === 0) {
      throw new ForbiddenException('You do not own any of the selected contents');
    }

    // Delete owned contents
    await this.prisma.content.deleteMany({
      where: { id: { in: ownedContentIds } },
    });

    return {
      success: true,
      deleted: ownedContentIds.length,
      skipped: contentIds.length - ownedContentIds.length,
      message: `Successfully deleted ${ownedContentIds.length} content(s)`,
    };
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
