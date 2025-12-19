import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/annotation.dto';
import { StudyGroupsWebSocketGateway } from '../websocket/study-groups-ws.gateway';

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
    if (dto.visibility === 'GROUP' && dto.groupId) {
      this.wsGateway.emitToGroup(dto.groupId, 'annotation:created', annotation);
    }

    return annotation;
  }

  async getByContent(contentId: string, userId: string, groupId?: string) {
    return this.prisma.annotation.findMany({
      where: {
        contentId,
        OR: [
          { userId, visibility: 'PRIVATE' },
          { groupId, visibility: 'GROUP' },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startOffset: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException('Not your annotation');
    }

    const updated = await this.prisma.annotation.update({
      where: { id },
      data: { text: dto.text, updatedAt: new Date() },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    if (annotation.visibility === 'GROUP' && annotation.groupId) {
      this.wsGateway.emitToGroup(annotation.groupId, 'annotation:updated', updated);
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException('Not your annotation');
    }

    await this.prisma.annotation.delete({ where: { id } });

    // Real-time broadcast
    if (annotation.visibility === 'GROUP' && annotation.groupId) {
      this.wsGateway.emitToGroup(annotation.groupId, 'annotation:deleted', { id });
    }

    return { deleted: true };
  }
}
