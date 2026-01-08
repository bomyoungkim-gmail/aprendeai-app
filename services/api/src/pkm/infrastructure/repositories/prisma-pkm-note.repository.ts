import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPkmNoteRepository } from '../../domain/repositories/pkm-note.repository.interface';
import { PkmNote } from '../../domain/entities/pkm-note.entity';
// PkmNoteStatus values: 'GENERATED', 'SAVED', 'ARCHIVED'

@Injectable()
export class PrismaPkmNoteRepository implements IPkmNoteRepository {
  private readonly logger = new Logger(PrismaPkmNoteRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(note: PkmNote): Promise<PkmNote> {
    const created = await (this.prisma as any).pkm_notes.create({
      data: {
        id: note.id,
        user_id: note.userId,
        content_id: note.contentId,
        session_id: note.sessionId,
        mission_id: note.missionId,
        topic_node_id: note.topicNodeId,
        title: note.title,
        body_md: note.bodyMd,
        tags_json: note.tags,
        backlinks_json: note.backlinks as any,
        source_metadata: note.sourceMetadata as any,
        status: note.status,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PkmNote[]> {
    const notes = await (this.prisma as any).pkm_notes.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return notes.map((note) => this.toDomain(note));
  }

  async findByContentId(contentId: string): Promise<PkmNote[]> {
    const notes = await (this.prisma as any).pkm_notes.findMany({
      where: { content_id: contentId },
      orderBy: { created_at: 'desc' },
    });

    return notes.map((note) => this.toDomain(note));
  }

  async findBySessionId(sessionId: string): Promise<PkmNote[]> {
    const notes = await (this.prisma as any).pkm_notes.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
    });

    return notes.map((note) => this.toDomain(note));
  }

  async findByTopicNodeId(
    topicNodeId: string,
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PkmNote[]> {
    const notes = await (this.prisma as any).pkm_notes.findMany({
      where: {
        topic_node_id: topicNodeId,
        user_id: userId,
        status: { not: 'ARCHIVED' }, // Only return active notes
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return notes.map((note) => this.toDomain(note));
  }

  async findById(id: string): Promise<PkmNote | null> {
    const note = await (this.prisma as any).pkm_notes.findUnique({
      where: { id },
    });

    return note ? this.toDomain(note) : null;
  }

  async update(id: string, data: Partial<PkmNote>): Promise<PkmNote> {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.bodyMd !== undefined) updateData.body_md = data.bodyMd;
    if (data.tags !== undefined) updateData.tags_json = data.tags;
    if (data.backlinks !== undefined)
      updateData.backlinks_json = data.backlinks;
    if (data.status !== undefined) updateData.status = data.status;

    updateData.updated_at = new Date();

    const updated = await (this.prisma as any).pkm_notes.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  async updateStatus(id: string, status: string): Promise<PkmNote> {
    const updated = await (this.prisma as any).pkm_notes.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: set status to ARCHIVED
    await (this.prisma as any).pkm_notes.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        updated_at: new Date(),
      },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await (this.prisma as any).pkm_notes.delete({
      where: { id },
    });
  }

  async countByUserId(
    userId: string,
    status?: string,
  ): Promise<number> {
    return (this.prisma as any).pkm_notes.count({
      where: {
        user_id: userId,
        ...(status && { status }),
      },
    });
  }

  private toDomain(prismaNote: any): PkmNote {
    return new PkmNote(
      prismaNote.id,
      prismaNote.user_id,
      prismaNote.content_id,
      prismaNote.session_id,
      prismaNote.mission_id,
      prismaNote.topic_node_id,
      prismaNote.title,
      prismaNote.body_md,
      Array.isArray(prismaNote.tags_json) ? prismaNote.tags_json : [],
      prismaNote.backlinks_json,
      prismaNote.source_metadata,
      prismaNote.status,
      prismaNote.created_at,
      prismaNote.updated_at,
    );
  }
}
