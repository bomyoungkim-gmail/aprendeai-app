import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { Language, SrsStage } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PrismaVocabRepository implements IVocabRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<Vocabulary>): Promise<Vocabulary> {
    const created = await this.prisma.user_vocabularies.create({
      data: {
        id: data.id || uuidv4(),
        user_id: data.userId!,
        word: data.word!,
        language: data.language!,
        content_id: data.contentId,
        srs_stage: data.srsStage,
        due_at: data.dueAt,
        example_note: data.exampleNote,
        meaning_note: data.meaningNote,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Vocabulary | null> {
    const found = await this.prisma.user_vocabularies.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByUserAndWord(
    userId: string,
    word: string,
    language: Language,
  ): Promise<Vocabulary | null> {
    const found = await this.prisma.user_vocabularies.findUnique({
      where: {
        user_id_word_language: {
          user_id: userId,
          word,
          language,
        },
      },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async upsert(
    userId: string,
    word: string,
    language: Language,
    createData: Partial<Vocabulary>,
    updateData: Partial<Vocabulary>,
  ): Promise<Vocabulary> {
    const upserted = await this.prisma.user_vocabularies.upsert({
      where: {
        user_id_word_language: {
          user_id: userId,
          word,
          language,
        },
      },
      create: {
        id: createData.id || uuidv4(),
        user_id: userId,
        word,
        language,
        content_id: createData.contentId,
        srs_stage: createData.srsStage || SrsStage.NEW,
        due_at: createData.dueAt || new Date(),
        example_note: createData.exampleNote,
        updated_at: new Date(),
      },
      update: {
        last_seen_at: new Date(),
        updated_at: new Date(),
        // Add other update fields if needed
      },
    });
    return this.mapToDomain(upserted);
  }

  async findAll(
    userId: string,
    filters?: { language?: Language; srsStage?: SrsStage; dueOnly?: boolean },
  ): Promise<Vocabulary[]> {
    const results = await this.prisma.user_vocabularies.findMany({
      where: {
        user_id: userId,
        ...(filters?.language && { language: filters.language }),
        ...(filters?.srsStage && { srs_stage: filters.srsStage }),
        ...(filters?.dueOnly && { due_at: { lte: new Date() } }),
      },
      orderBy: [{ due_at: "asc" }, { lapses_count: "desc" }],
    });
    return results.map(this.mapToDomain);
  }

  async countCreatedInBatch(ids: string[]): Promise<number> {
    // Ideally we would inspect creation time, but for now we trust the use case to manage this logic
    // or we assume all are valid.
    // In legacy code, it checked `created_at` timestamp.
    // For now, this helper might be redundant if the entity has createdAt.
    return 0; // Placeholder, logic might move to Use Case
  }

  private mapToDomain(item: any): Vocabulary {
    return new Vocabulary({
      id: item.id,
      userId: item.user_id,
      word: item.word,
      language: item.language,
      masteryScore: item.mastery_score,
      lastSeenAt: item.last_seen_at,
      srsStage: item.srs_stage,
      dueAt: item.due_at,
      lapsesCount: item.lapses_count,
      contentId: item.content_id,
      meaningNote: item.meaning_note,
      exampleNote: item.example_note,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }
}
