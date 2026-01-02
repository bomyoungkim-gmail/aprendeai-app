import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { CornellNote } from "../../domain/entities/cornell-note.entity";

@Injectable()
export class PrismaCornellRepository implements ICornellRepository {
  constructor(private prisma: PrismaService) {}

  async findByContentAndUser(
    contentId: string,
    userId: string,
  ): Promise<CornellNote | null> {
    const found = await this.prisma.cornell_notes.findUnique({
      where: {
        content_id_user_id: { content_id: contentId, user_id: userId },
      },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async create(note: CornellNote): Promise<CornellNote> {
    const created = await this.prisma.cornell_notes.create({
      data: {
        id: note.id,
        content_id: note.contentId,
        user_id: note.userId,
        cues_json: note.cues || [],
        notes_json: note.notes || [],
        summary_text: note.summary || "",
      },
    });
    return this.mapToDomain(created);
  }

  async update(note: CornellNote): Promise<CornellNote> {
    const updated = await this.prisma.cornell_notes.update({
      where: { id: note.id },
      data: {
        cues_json: note.cues ?? undefined,
        notes_json: note.notes ?? undefined,
        summary_text: note.summary ?? undefined,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  private mapToDomain(prismaNote: any): CornellNote {
    return new CornellNote({
      id: prismaNote.id,
      contentId: prismaNote.content_id,
      userId: prismaNote.user_id,
      cues: prismaNote.cues_json as any[],
      notes: prismaNote.notes_json as any[],
      summary: prismaNote.summary_text,
      createdAt: prismaNote.created_at,
      updatedAt: prismaNote.updated_at,
    });
  }
}
