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
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCornellHighlightDto,
  UpdateHighlightVisibilityDto,
  CreateAnnotationCommentDto,
} from '../dto/create-cornell-highlight.dto';
import {
  AnnotationVisibility,
  AnnotationStatus,
  VisibilityScope,
  ContextType,
} from '../../common/constants/enums';

@Injectable()
export class CornellHighlightsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.highlight.create({
      data: {
        contentId,
        userId,
        kind: this.getHighlightKind(dto.target_type),
        targetType: dto.target_type,
        pageNumber: dto.page_number,
        anchorJson: (dto.anchor_json || {}) as any,
        timestampMs: dto.timestamp_ms,
        durationMs: dto.duration_ms,
        colorKey: dto.color_key,
        tagsJson: dto.tags_json as any,
        commentText: dto.comment_text,
        visibility: dto.visibility || AnnotationVisibility.PRIVATE,
        visibilityScope: dto.visibility_scope,
        contextType: dto.context_type,
        contextId: dto.context_id,
        learnerId: dto.learner_id,
        status: AnnotationStatus.ACTIVE,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get highlights for a content (with permission filtering)
   */
  async getHighlights(contentId: string, userId: string) {
    const highlights = await this.prisma.highlight.findMany({
      where: {
        contentId,
        status: AnnotationStatus.ACTIVE,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        comments: {
          where: { status: AnnotationStatus.ACTIVE },
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
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
    const highlight = await this.prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    // Only owner can change visibility
    if (highlight.userId !== userId) {
      throw new ForbiddenException('Only owner can change visibility');
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

    return this.prisma.highlight.update({
      where: { id: highlightId },
      data: {
        visibility: dto.visibility,
        visibilityScope: dto.visibility_scope,
        contextType: dto.context_type,
        contextId: dto.context_id,
        learnerId: dto.learner_id,
      },
    });
  }

  /**
   * Delete highlight (soft delete)
   */
  async deleteHighlight(highlightId: string, userId: string) {
    const highlight = await this.prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (highlight.userId !== userId) {
      throw new ForbiddenException('Only owner can delete');
    }

    return this.prisma.highlight.update({
      where: { id: highlightId },
      data: {
        status: AnnotationStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Create comment on highlight (thread system)
   */
  async createComment(
    highlightId: string,
    userId: string,
    dto: CreateAnnotationCommentDto,
  ) {
    const highlight = await this.prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    // Check read permission
    if (!(await this.canReadHighlight(userId, highlight))) {
      throw new ForbiddenException('Cannot comment on this highlight');
    }

    return this.prisma.annotationComment.create({
      data: {
        highlightId,
        userId,
        text: dto.text,
        status: AnnotationStatus.ACTIVE,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
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
        'context_type and context_id required for GROUP visibility',
      );
    }

    switch (contextType) {
      case ContextType.INSTITUTION:
        await this.validateInstitutionAccess(userId, contextId, scope, learnerId);
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
    const member = await this.prisma.institutionMember.findUnique({
      where: {
        institutionId_userId: { institutionId, userId },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('Not a member of this institution');
    }

    if (scope === VisibilityScope.ONLY_EDUCATORS && member.role !== 'TEACHER') {
      throw new ForbiddenException('Only educators can use this scope');
    }

    if (scope === VisibilityScope.RESPONSIBLES_OF_LEARNER) {
      if (!learnerId) {
        throw new BadRequestException('learner_id required for this scope');
      }
      await this.validateIsResponsible(userId, learnerId);
    }
  }

  private async validateGroupAccess(userId: string, groupId: string) {
    const member = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('Not a member of this group');
    }
  }

  private async validateFamilyAccess(userId: string, familyId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('Not a member of this family');
    }
  }

  private async validateIsResponsible(userId: string, learnerId: string) {
    const relationship = await this.prisma.familyMember.findFirst({
      where: {
        userId,
        family: {
          members: {
            some: {
              userId: learnerId,
              status: 'ACTIVE',
            },
          },
        },
        role: { in: ['GUARDIAN', 'EDUCATOR'] },
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      throw new ForbiddenException('Not a responsible for this learner');
    }
  }

  /**
   * Check if user can read a highlight
   */
  private async canReadHighlight(userId: string, highlight: any): Promise<boolean> {
    // Owner can always read
    if (highlight.userId === userId) return true;

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

  private async checkContextMembership(userId: string, highlight: any): Promise<boolean> {
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
  private getHighlightKind(targetType: string): 'TEXT' | 'AREA' {
    return targetType === 'VIDEO' || targetType === 'AUDIO' ? 'TEXT' : 'AREA';
  }
}
