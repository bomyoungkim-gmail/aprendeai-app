import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { ActivityService } from "../activity/activity.service";
import { ContentAccessService } from "./services/content-access.service";
import type {
  UpdateCornellDto,
  UpdateHighlightDto,
  UpdateContentDto,
} from "./dto/cornell.dto";
import { CreateCornellHighlightDto } from "./dto/create-cornell-highlight.dto";
import { Environment } from "@prisma/client";
import { GetContentUseCase } from "./application/use-cases/get-content.use-case";
import { ListContentUseCase } from "./application/use-cases/list-content.use-case";
import { UpdateContentUseCase } from "./application/use-cases/update-content.use-case";
import { DeleteContentUseCase } from "./application/use-cases/delete-content.use-case";
import { GetOrCreateCornellNoteUseCase } from "./application/use-cases/get-or-create-cornell-note.use-case";
import { UpdateCornellNoteUseCase } from "./application/use-cases/update-cornell-note.use-case";
import { CreateHighlightUseCase } from "./application/use-cases/create-highlight.use-case";
import { UpdateHighlightUseCase } from "./application/use-cases/update-highlight.use-case";
import { DeleteHighlightUseCase } from "./application/use-cases/delete-highlight.use-case";
import { GetHighlightsUseCase } from "./application/use-cases/get-highlights.use-case";

@Injectable()
export class CornellService {
  constructor(
    private prisma: PrismaService, // Kept for bulkDelete and legacy ops if needed
    private usageTracking: UsageTrackingService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
    private contentAccessService: ContentAccessService,
    // Content Use Cases
    private getContentUseCase: GetContentUseCase,
    private listContentUseCase: ListContentUseCase,
    private updateContentUseCase: UpdateContentUseCase,
    private deleteContentUseCase: DeleteContentUseCase,
    // Cornell Use Cases
    private getOrCreateCornellNoteUseCase: GetOrCreateCornellNoteUseCase,
    private updateCornellNoteUseCase: UpdateCornellNoteUseCase,
    private createHighlightUseCase: CreateHighlightUseCase,
    private updateHighlightUseCase: UpdateHighlightUseCase,
    private deleteHighlightUseCase: DeleteHighlightUseCase,
    private getHighlightsUseCase: GetHighlightsUseCase,
  ) {}

  private getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === "production") return Environment.PROD;
    if (env === "staging") return Environment.STAGING;
    return Environment.DEV;
  }

  async getMyContents(userId: string) {
    const { results } = await this.listContentUseCase.execute(userId, {
      limit: 100,
    });
    return results.map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type,
      contentType: content.type,
      original_language: content.originalLanguage,
      raw_text: content.rawText,
      owner_type: content.scopeType,
      owner_id: content.scopeId,
      created_at: content.createdAt,
      updated_at: content.updatedAt,
      metadata: content.metadata,
      files: content.file ? { ...content.file, viewUrl: `/files/${content.file.id}/view` } : null,
      file: content.file
        ? {
            ...content.file,
            sizeBytes: Number(content.file.sizeBytes),
            viewUrl: `/files/${content.file.id}/view`,
          }
        : null,
    }));
  }

  async getContent(contentId: string, userId: string) {
    const content = await this.getContentUseCase.execute(contentId, userId);
    return {
      id: content.id,
      title: content.title,
      type: content.type,
      contentType: content.type,
      original_language: content.originalLanguage,
      raw_text: content.rawText,
      owner_type: content.scopeType,
      owner_id: content.scopeId,
      scope_type: content.scopeType,
      scope_id: content.scopeId,
      metadata: content.metadata,
      created_at: content.createdAt,
      updated_at: content.updatedAt,
      files: content.file
        ? {
            ...content.file,
            viewUrl: `/files/${content.file.id}/view`,
          }
        : null,
      file: content.file
        ? {
            ...content.file,
            viewUrl: `/files/${content.file.id}/view`,
          }
        : null,
    };
  }

  async updateContent(id: string, userId: string, dto: UpdateContentDto) {
    const updated = await this.updateContentUseCase.execute(id, userId, dto);
    
    // TODO (Issue #19.8): Trigger auto-baseline build
    // After content update/import, we should queue a job to rebuild the Baseline Graph
    // this.eventEmitter.emit('content.updated', { contentId: id });

    return {
      id: updated.id,
      title: updated.title,
      metadata: updated.metadata,
      updated_at: updated.updatedAt,
    };
  }

  async deleteContent(contentId: string, userId: string) {
    await this.deleteContentUseCase.execute(contentId, userId);
    return { success: true, message: "Content deleted successfully" };
  }

  async bulkDeleteContents(contentIds: string[], userId: string) {
    if (!contentIds || contentIds.length === 0) {
      throw new BadRequestException("No content IDs provided");
    }
    const contents = await this.prisma.contents.findMany({
      where: { id: { in: contentIds } },
      select: { id: true },
    });

    // Use centralized access check
    const accessChecks = await Promise.all(
      contents.map(async (c) => ({
        id: c.id,
        hasAccess: await this.contentAccessService.canAccessContent(
          c.id,
          userId,
        ),
      })),
    );

    const ownedContentIds = accessChecks
      .filter((check) => check.hasAccess)
      .map((check) => check.id);

    if (ownedContentIds.length === 0) {
      throw new ForbiddenException(
        "You do not have permission to delete any of the selected contents",
      );
    }

    await this.prisma.contents.deleteMany({
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
    // Map Domain Entity to DB Shape for Controller logic if needed
    // Or return Entity. Valid choice: return Entity, Controller serializes.
    const note = await this.getOrCreateCornellNoteUseCase.execute(
      contentId,
      userId,
    );
    return {
      id: note.id,
      content_id: note.contentId,
      user_id: note.userId,
      notes_json: note.notes,
      summary_text: note.summary,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    };
  }

  async updateCornellNotes(
    contentId: string,
    dto: UpdateCornellDto,
    userId: string,
  ) {
    const note = await this.updateCornellNoteUseCase.execute(
      contentId,
      userId,
      dto,
    );
    return {
      id: note.id,
      notes_json: note.notes,
      summary_text: note.summary,
      updated_at: note.updatedAt,
    };
  }

  async getHighlights(contentId: string, userId: string) {
    const highlights = await this.getHighlightsUseCase.execute(
      contentId,
      userId,
    );
    // Use repository map? No, map to legacy response or return entities.
    return highlights.map((h) => ({
      id: h.id,
      content_id: h.contentId,
      user_id: h.userId,
      kind: h.kind,
      target_type: h.targetType,
      page_number: h.pageNumber,
      anchor_json: h.anchor,
      color_key: h.colorKey,
      comment_text: h.commentText,
      tags_json: h.tags,
      created_at: h.createdAt,
      updated_at: h.updatedAt,
    }));
  }

  async getConfig() {
    return {
      types: [
        { id: "EVIDENCE", label: "Evidência", color: "yellow", tag: "evidence" },
        { id: "VOCABULARY", label: "Vocabulário", color: "blue", tag: "vocab" },
        { id: "MAIN_IDEA", label: "Ideia Central", color: "green", tag: "main-idea" },
        { id: "DOUBT", label: "Dúvida", color: "red", tag: "doubt" },
        { id: "SYNTHESIS", label: "Síntese", color: "purple", tag: "synthesis" },
      ],
      tabs: [
        { id: "STREAM", label: "Stream", icon: "activity" },
        { id: "CHAT", label: "Chat IA", icon: "message-square" },
        { id: "VOCABULARY", label: "Vocabulário", icon: "file-text" },
        { id: "DOUBTS", label: "Dúvidas", icon: "help-circle" },
        { id: "ANALYTICS", label: "Analíticos", icon: "bar-chart-2" },
      ],
      defaults: {
        viewMode: "study",
        sidebarVisible: true,
      },
    };
  }

  async createHighlight(
    contentId: string,
    dto: CreateCornellHighlightDto,
    userId: string,
  ) {
    const h = await this.createHighlightUseCase.execute(contentId, userId, dto);
    return {
      id: h.id,
      content_id: h.contentId,
      user_id: h.userId,
      kind: h.kind,
      target_type: h.targetType,
      page_number: h.pageNumber,
      anchor_json: h.anchor,
      color_key: h.colorKey,
      comment_text: h.commentText,
      tags_json: h.tags,
      created_at: h.createdAt,
      updated_at: h.updatedAt,
    };
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto, userId: string) {
    const h = await this.updateHighlightUseCase.execute(id, dto, userId);
    return {
      id: h.id,
      color_key: h.colorKey,
      comment_text: h.commentText,
      tags_json: h.tags,
      updated_at: h.updatedAt,
    };
  }

  async deleteHighlight(id: string, userId: string) {
    await this.deleteHighlightUseCase.execute(id, userId);
    return { success: true };
  }
}
