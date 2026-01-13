/**
 * Cornell Highlights Service
 *
 * Handles CRUD operations for Cornell Notes highlights with granular authorization.
 * Supports multiple content types (PDF, Image, Video, Audio) and sharing contexts.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { fromEvent } from "rxjs";
import { map, filter } from "rxjs/operators";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateCornellHighlightDto,
  UpdateHighlightVisibilityDto,
  CreateAnnotationCommentDto,
} from "../dto/create-cornell-highlight.dto";
import {
  AnnotationVisibility,
  AnnotationStatus,
  VisibilityScope,
  ContextType,
} from "../../common/constants/enums";
import {
  CornellEvent,
  type CornellEventPayload,
} from "../events/cornell.events";

@Injectable()
export class CornellHighlightsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new Cornell highlight
   */
  async createHighlight(
    contentId: string,
    userId: string,
    dto: CreateCornellHighlightDto,
  ) {
    // Validate GROUP visibility context access
    if (dto.visibility === AnnotationVisibility.GROUP) {
      await this.validateContextAccess(
        userId,
        dto.context_type,
        dto.context_id,
        dto.visibility_scope,
        dto.learner_id,
      );
    }

    const highlight = await this.prisma.highlights.create({
      data: {
        id: crypto.randomUUID(),
        content_id: contentId,
        user_id: userId,
        kind: this.getHighlightKind(dto.target_type),
        target_type: dto.target_type,
        page_number: dto.page_number,
        anchor_json: (dto.anchor_json || {}) as any,
        timestamp_ms: dto.timestamp_ms,
        duration_ms: dto.duration_ms,
        color_key: dto.color_key,
        tags_json: dto.tags_json as any,
        comment_text: dto.comment_text,
        visibility: dto.visibility || AnnotationVisibility.PRIVATE,
        visibility_scope: dto.visibility_scope,
        context_type: dto.context_type,
        context_id: dto.context_id,
        learner_id: dto.learner_id,
        status: AnnotationStatus.ACTIVE,
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    // Emit event for real-time notifications
    this.eventEmitter.emit(CornellEvent.ANNOTATION_CREATED, {
      contentId,
      highlightId: highlight.id,
      userId,
      action: CornellEvent.ANNOTATION_CREATED,
      timestamp: Date.now(),
      data: {
        type: dto.type,
        hasAnchor: !!dto.anchor_json,
        pageNumber: dto.page_number,
        targetType: dto.target_type,
      },
    } as CornellEventPayload);

    return highlight;
  }

  /**
   * Get highlights for a content (with permission filtering)
   */
  async getHighlights(contentId: string, userId: string) {
    const highlights = await this.prisma.highlights.findMany({
      where: {
        content_id: contentId,
        status: AnnotationStatus.ACTIVE,
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
        annotation_comments: {
          where: { status: AnnotationStatus.ACTIVE },
          include: {
            users: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Filter based on permissions
    const filtered = await Promise.all(
      highlights.map(async (h) => {
        const canRead = await this.canReadHighlight(userId, h);
        return canRead ? h : null;
      }),
    );

    return filtered.filter((h) => h !== null);
  }

  /**
   * Update highlight visibility
   */
  async updateVisibility(
    highlightId: string,
    userId: string,
    dto: UpdateHighlightVisibilityDto,
  ) {
    const highlight = await this.prisma.highlights.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException("Highlight not found");
    }

    // Only owner can change visibility
    if (highlight.user_id !== userId) {
      throw new ForbiddenException("Only owner can change visibility");
    }

    // Validate new context if GROUP
    if (dto.visibility === AnnotationVisibility.GROUP) {
      await this.validateContextAccess(
        userId,
        dto.context_type,
        dto.context_id,
        dto.visibility_scope,
        dto.learner_id,
      );
    }

    const updated = await this.prisma.highlights.update({
      where: { id: highlightId },
      data: {
        visibility: dto.visibility,
        visibility_scope: dto.visibility_scope,
        context_type: dto.context_type,
        context_id: dto.context_id,
        learner_id: dto.learner_id,
      },
    });

    // Emit event
    this.eventEmitter.emit(CornellEvent.ANNOTATION_UPDATED, {
      contentId: highlight.content_id,
      highlightId,
      userId,
      action: CornellEvent.ANNOTATION_UPDATED,
      timestamp: Date.now(),
      data: { visibility: dto.visibility },
    } as CornellEventPayload);

    return updated;
  }

  /**
   * Delete highlight (soft delete)
   */
  async deleteHighlight(highlightId: string, userId: string) {
    const highlight = await this.prisma.highlights.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException("Highlight not found");
    }

    if (highlight.user_id !== userId) {
      throw new ForbiddenException("Only owner can delete");
    }

    const deleted = await this.prisma.highlights.update({
      where: { id: highlightId },
      data: {
        status: AnnotationStatus.DELETED,
        deleted_at: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit(CornellEvent.ANNOTATION_DELETED, {
      contentId: highlight.content_id,
      highlightId,
      userId,
      action: CornellEvent.ANNOTATION_DELETED,
      timestamp: Date.now(),
    } as CornellEventPayload);

    return deleted;
  }

  /**
   * Create comment on highlight (thread system)
   */
  async createComment(
    highlightId: string,
    userId: string,
    dto: CreateAnnotationCommentDto,
  ) {
    const highlight = await this.prisma.highlights.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException("Highlight not found");
    }

    // Check read permission
    if (!(await this.canReadHighlight(userId, highlight))) {
      throw new ForbiddenException("Cannot comment on this highlight");
    }

    const comment = await this.prisma.annotation_comments.create({
      data: {
        id: crypto.randomUUID(),
        highlight_id: highlightId,
        user_id: userId,
        text: dto.text,
        status: AnnotationStatus.ACTIVE,
        updated_at: new Date(), // Mandatory field
      },
      include: {
        users: { select: { id: true, name: true } },
      },
    });

    // Emit event
    this.eventEmitter.emit(CornellEvent.COMMENT_ADDED, {
      contentId: highlight.content_id,
      highlightId,
      userId,
      action: CornellEvent.COMMENT_ADDED,
      timestamp: Date.now(),
      data: { commentId: comment.id },
    } as CornellEventPayload);

    return comment;
  }

  // ========================================
  // PRIVATE AUTHORIZATION HELPERS
  // ========================================

  /**
   * Validate user has access to the context
   */
  private async validateContextAccess(
    userId: string,
    contextType: ContextType,
    contextId: string,
    scope: VisibilityScope,
    learnerId?: string,
  ) {
    if (!contextType || !contextId) {
      throw new BadRequestException(
        "context_type and context_id required for GROUP visibility",
      );
    }

    switch (contextType) {
      case ContextType.INSTITUTION:
        await this.validateInstitutionAccess(
          userId,
          contextId,
          scope,
          learnerId,
        );
        break;
      case ContextType.GROUP_STUDY:
        await this.validateGroupAccess(userId, contextId);
        break;
      case ContextType.FAMILY:
        await this.validateFamilyAccess(userId, contextId);
        break;
    }
  }

  private async validateInstitutionAccess(
    userId: string,
    institutionId: string,
    scope: VisibilityScope,
    learnerId?: string,
  ) {
    const member = await this.prisma.institution_members.findFirst({
      where: {
        institution_id: institutionId,
        user_id: userId,
      },
    });

    if (!member || member.status !== "ACTIVE") {
      throw new ForbiddenException("Not a member of this institution");
    }

    if (scope === VisibilityScope.ONLY_EDUCATORS && member.role !== "TEACHER") {
      throw new ForbiddenException("Only educators can use this scope");
    }

    if (scope === VisibilityScope.RESPONSIBLES_OF_LEARNER) {
      if (!learnerId) {
        throw new BadRequestException("learner_id required for this scope");
      }
      await this.validateIsResponsible(userId, learnerId);
    }
  }

  private async validateGroupAccess(userId: string, groupId: string) {
    const member = await this.prisma.study_group_members.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.status !== "ACTIVE") {
      throw new ForbiddenException("Not a member of this group");
    }
  }

  private async validateFamilyAccess(userId: string, familyId: string) {
    const member = await this.prisma.family_members.findUnique({
      where: { family_id_user_id: { family_id: familyId, user_id: userId } },
    });

    if (!member || member.status !== "ACTIVE") {
      throw new ForbiddenException("Not a member of this family");
    }
  }

  private async validateIsResponsible(userId: string, learnerId: string) {
    const relationship = await this.prisma.family_members.findFirst({
      where: {
        user_id: userId,
        families: {
          family_members: {
            some: {
              user_id: learnerId,
              status: "ACTIVE",
            },
          },
        },
        role: { in: ["GUARDIAN"] },
        status: "ACTIVE",
      },
    });

    if (!relationship) {
      throw new ForbiddenException("Not a responsible for this learner");
    }
  }

  /**
   * Check if user can read a highlight
   */
  private async canReadHighlight(
    userId: string,
    highlight: any,
  ): Promise<boolean> {
    // Owner can always read
    if (highlight.user_id === userId) return true;

    // PUBLIC is readable by anyone
    if (highlight.visibility === AnnotationVisibility.PUBLIC) return true;

    // PRIVATE only by owner
    if (highlight.visibility === AnnotationVisibility.PRIVATE) return false;

    // Deleted highlights not readable
    if (highlight.status === AnnotationStatus.DELETED) return false;

    // GROUP: check context membership
    if (highlight.visibility === AnnotationVisibility.GROUP) {
      return this.checkContextMembership(userId, highlight);
    }

    return false;
  }

  private async checkContextMembership(
    userId: string,
    highlight: any,
  ): Promise<boolean> {
    try {
      await this.validateContextAccess(
        userId,
        highlight.contextType,
        highlight.contextId,
        highlight.visibilityScope,
        highlight.learnerId,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get highlight kind based on target type
   */
  private getHighlightKind(targetType: string): "TEXT" | "AREA" {
    return targetType === "VIDEO" || targetType === "AUDIO" ? "TEXT" : "AREA";
  }

  /**
   * Subscribe to Cornell events for a specific content
   * Returns an Observable for SSE
   */
  subscribeToEvents(contentId: string) {
    return fromEvent(this.eventEmitter, "cornell.*").pipe(
      filter((payload: any) => payload.contentId === contentId),
      map((payload: any) => ({
        data: payload,
      })),
    );
  }
}
