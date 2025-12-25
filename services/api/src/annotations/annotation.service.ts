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

  async create(contentId: string, userId: string, dto: CreateAnnotationDto) {
    const annotation = await this.prisma.annotation.create({
      data: {
        contentId,
        userId,
        type: dto.type,
        startOffset: dto.startOffset,
        endOffset: dto.endOffset,
        selectedText: dto.selectedText,
        text: dto.text,
        color: dto.color,
        visibility: dto.visibility,
        groupId: dto.groupId,
        parentId: dto.parentId,
      },
      include: {
        user: { select: { id: true, name: true } },
        parent: true,
      },
    });

    // Real-time broadcast to group members
    if (dto.visibility === "GROUP" && dto.groupId) {
      this.wsGateway.emitToGroup(dto.groupId, "annotation:created", annotation);
    }

    return annotation;
  }

  async getByContent(contentId: string, userId: string, groupId?: string) {
    return this.prisma.annotation.findMany({
      where: {
        contentId,
        OR: [
          { userId, visibility: "PRIVATE" },
          { groupId, visibility: "GROUP" },
          { visibility: "PUBLIC" },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startOffset: "asc" },
    });
  }

  async update(id: string, userId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    const updated = await this.prisma.annotation.update({
      where: { id },
      data: { text: dto.text, updatedAt: new Date() },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    if (annotation.visibility === "GROUP" && annotation.groupId) {
      this.wsGateway.emitToGroup(
        annotation.groupId,
        "annotation:updated",
        updated,
      );
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    await this.prisma.annotation.delete({ where: { id } });

    // Real-time broadcast
    if (annotation.visibility === "GROUP" && annotation.groupId) {
      this.wsGateway.emitToGroup(annotation.groupId, "annotation:deleted", {
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
      userId, // Only search user's own annotations
      AND: [],
    };

    // Text search
    if (params.query) {
      where.AND.push({
        OR: [
          { text: { contains: params.query, mode: "insensitive" } },
          { selectedText: { contains: params.query, mode: "insensitive" } },
        ],
      });
    }

    // Filter by type
    if (params.type) {
      where.AND.push({ type: params.type });
    }

    // Filter by content
    if (params.contentId) {
      where.AND.push({ contentId: params.contentId });
    }

    // Filter by group
    if (params.groupId) {
      where.AND.push({ groupId: params.groupId });
    }

    // Filter by color
    if (params.color) {
      where.AND.push({ color: params.color });
    }

    // Filter by favorite
    if (params.isFavorite !== undefined) {
      where.AND.push({ isFavorite: params.isFavorite });
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
      where.AND.push({ createdAt: dateFilter });
    }

    // Remove empty AND if no filters
    if (where.AND.length === 0) {
      delete where.AND;
    }

    return this.prisma.annotation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        content: { select: { id: true, title: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create reply to annotation
   */
  async createReply(parentId: string, userId: string, dto: CreateReplyDto) {
    const parent = await this.prisma.annotation.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException("Parent annotation not found");
    }

    const reply = await this.prisma.annotation.create({
      data: {
        contentId: parent.contentId,
        userId,
        type: "COMMENT",
        startOffset: parent.startOffset,
        endOffset: parent.endOffset,
        text: dto.content,
        color: dto.color,
        visibility: parent.visibility,
        groupId: parent.groupId,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true } },
        parent: true,
      },
    });

    // Real-time broadcast
    if (parent.visibility === "GROUP" && parent.groupId) {
      this.wsGateway.emitToGroup(parent.groupId, "annotation:reply", reply);
    }

    // Audit trail - track reply creation
    await this.prisma.sessionEvent.create({
      data: {
        eventType: "ANNOTATION_REPLY_CREATED",
        payloadJson: {
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
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException("Annotation not found");
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException("Not your annotation");
    }

    const updated = await this.prisma.annotation.update({
      where: { id },
      data: { isFavorite: !annotation.isFavorite },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Audit trail - track favorite toggle
    await this.prisma.sessionEvent.create({
      data: {
        eventType: "ANNOTATION_FAVORITE_TOGGLED",
        payloadJson: {
          annotationId: id,
          favorite: updated.isFavorite,
          userId,
        },
      },
    });

    return updated;
  }
}
