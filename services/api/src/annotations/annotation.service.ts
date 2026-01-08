import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAnnotationDto, UpdateAnnotationDto } from "./dto/annotation.dto";
import { SearchAnnotationsDto } from "./dto/search-annotations.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";

@Injectable()
export class AnnotationService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: StudyGroupsWebSocketGateway,
  ) {}

  /**
   * Validate that user is an active member of the group (Security Fix - Issue #4)
   */
  private async validateGroupMembership(userId: string, groupId: string): Promise<void> {
    const membership = await this.prisma.study_group_members.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId }
      }
    });
    
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `User ${userId} is not an active member of group ${groupId}`
      );
    }
  }

  async create(contentId: string, userId: string, dto: CreateAnnotationDto) {
    // ✅ Security: Validate membership if creating group annotation (Issue #4)
    if (dto.visibility === "GROUP" && dto.groupId) {
      await this.validateGroupMembership(userId, dto.groupId);
    }

    const annotation = await this.prisma.annotations.create({
      data: {
        content_id: contentId,
        user_id: userId,
        type: dto.type,
        start_offset: dto.startOffset,
        end_offset: dto.endOffset,
        selected_text: dto.selectedText,
        text: dto.text,
        color: dto.color,
        visibility: dto.visibility,
        group_id: dto.groupId,
        parent_id: dto.parentId,
      },
      include: {
        users: { select: { id: true, name: true } },
        annotations: { select: { id: true, text: true } }, // parent relation
      },
    });

    // Real-time broadcast to group members
    if (dto.visibility === "GROUP" && dto.groupId) {
      this.wsGateway.emitToGroup(dto.groupId, "annotation:created", annotation);
    }

    return annotation;
  }

  async getByContent(contentId: string, userId: string, groupId?: string) {
    // ✅ Security: Get user's group memberships for filtering (Issue #4)
    const userGroupIds: string[] = [];
    if (groupId) {
      // Validate membership in requested group
      const membership = await this.prisma.study_group_members.findUnique({
        where: {
          group_id_user_id: { group_id: groupId, user_id: userId }
        }
      });
      if (membership && membership.status === 'ACTIVE') {
        userGroupIds.push(groupId);
      }
    } else {
      // Get all groups user is member of
      const memberships = await this.prisma.study_group_members.findMany({
        where: { user_id: userId, status: 'ACTIVE' },
        select: { group_id: true }
      });
      userGroupIds.push(...memberships.map(m => m.group_id));
    }

    return this.prisma.annotations.findMany({
      where: {
        content_id: contentId,
        OR: [
          { user_id: userId },  // Own annotations
          { group_id: { in: userGroupIds }, visibility: "GROUP" },  // ✅ Only groups user is member of
          { visibility: "PUBLIC" },
        ],
      },
      include: {
        users: { select: { id: true, name: true } },
        other_annotations: {
          include: {
            users: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "asc" },
        },
      },
      orderBy: { start_offset: "asc" },
    });
  }

  async update(id: string, userId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.annotations.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.user_id !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    const updated = await this.prisma.annotations.update({
      where: { id },
      data: { text: dto.text },
      include: {
        users: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    if (annotation.visibility === "GROUP" && annotation.group_id) {
      this.wsGateway.emitToGroup(
        annotation.group_id,
        "annotation:updated",
        updated,
      );
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const annotation = await this.prisma.annotations.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.user_id !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    await this.prisma.annotations.delete({ where: { id } });

    // Real-time broadcast
    if (annotation.visibility === "GROUP" && annotation.group_id) {
      this.wsGateway.emitToGroup(annotation.group_id, "annotation:deleted", {
        id,
      });
    }

    return { deleted: true };
  }

  /**
   * Search annotations with multiple filters
   */
  async searchAnnotations(userId: string, params: SearchAnnotationsDto) {
    const where: any = {
      user_id: userId, // Only search user's own annotations
      AND: [],
    };

    // Text search
    if (params.query) {
      where.AND.push({
        OR: [
          { text: { contains: params.query, mode: "insensitive" } },
          { selected_text: { contains: params.query, mode: "insensitive" } },
        ],
      });
    }

    // Filter by type
    if (params.type) {
      where.AND.push({ type: params.type });
    }

    // Filter by content
    if (params.contentId) {
      where.AND.push({ content_id: params.contentId });
    }

    // Filter by group
    if (params.groupId) {
      where.AND.push({ group_id: params.groupId });
    }

    // Filter by color
    if (params.color) {
      where.AND.push({ color: params.color });
    }

    // Filter by favorite
    if (params.isFavorite !== undefined) {
      where.AND.push({ is_favorite: params.isFavorite });
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      const dateFilter: any = {};
      if (params.startDate) {
        dateFilter.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        dateFilter.lte = new Date(params.endDate);
      }
      where.AND.push({ created_at: dateFilter });
    }

    // Remove empty AND if no filters
    if (where.AND.length === 0) {
      delete where.AND;
    }

    return this.prisma.annotations.findMany({
      where,
      include: {
        users: { select: { id: true, name: true } },
        contents: { select: { id: true, title: true } },
        other_annotations: {
          include: {
            users: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Create reply to annotation
   */
  async createReply(parentId: string, userId: string, dto: CreateReplyDto) {
    const parent = await this.prisma.annotations.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException("Parent annotation not found");
    }

    const reply = await this.prisma.annotations.create({
      data: {
        content_id: parent.content_id,
        user_id: userId,
        type: "COMMENT",
        start_offset: parent.start_offset,
        end_offset: parent.end_offset,
        text: dto.content,
        color: dto.color,
        visibility: parent.visibility as any,
        group_id: parent.group_id,
        parent_id: parentId,
      },
      include: {
        users: { select: { id: true, name: true } },
        annotations: true,
      },
    });

    // Real-time broadcast
    if (parent.visibility === "GROUP" && parent.group_id) {
      this.wsGateway.emitToGroup(parent.group_id, "annotation:reply", reply);
    }

    // Audit trail - track reply creation
    await this.prisma.session_events.create({
      data: {
        event_type: "ANNOTATION_REPLY_CREATED",
        payload_json: {
          annotationId: parentId,
          replyId: reply.id,
          userId,
        },
      },
    });

    return reply;
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string, userId: string) {
    const annotation = await this.prisma.annotations.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.user_id !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    const updated = await this.prisma.annotations.update({
      where: { id },
      data: { is_favorite: !annotation.is_favorite },
      include: {
        users: { select: { id: true, name: true } },
      },
    });

    // Audit trail - track favorite toggle
    await this.prisma.session_events.create({
      data: {
        event_type: "ANNOTATION_FAVORITE_TOGGLED",
        payload_json: {
          annotationId: id,
          favorite: updated.is_favorite,
          userId,
        },
      },
    });

    return updated;
  }
}
