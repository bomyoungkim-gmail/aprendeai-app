import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IReviewRepository } from "../../domain/review.repository.interface";
import { Vocabulary } from "../../../vocab/domain/vocabulary.entity";
import { VocabAttempt } from "../../domain/vocab-attempt.entity";
import { SrsStage } from "@prisma/client";

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDue(userId: string, limit: number): Promise<Vocabulary[]> {
    const results = await this.prisma.user_vocabularies.findMany({
      where: {
        user_id: userId,
        due_at: { lte: new Date() },
      },
      orderBy: [{ due_at: "asc" }, { lapses_count: "desc" }],
      take: limit,
      include: {
        contents: {
          select: { id: true, title: true },
        },
      },
    });
    return results.map(this.mapVocabToDomain);
  }

  async countDue(userId: string): Promise<number> {
    return this.prisma.user_vocabularies.count({
      where: {
        user_id: userId,
        due_at: { lte: new Date() },
      },
    });
  }

  async recordAttemptAndUpdateVocab(
    attempt: VocabAttempt,
    vocabUpdate: {
      id: string;
      srsStage: SrsStage;
      dueAt: Date;
      lapsesIncrement: number;
      masteryDelta: number;
    },
  ): Promise<Vocabulary> {
    const { id, srsStage, dueAt, lapsesIncrement, masteryDelta } = vocabUpdate;
    const { dimension } = attempt;

    // We need to fetch current mastery to increment it, or use atomic increment if possible.
    // However, Prisma atomic operations on complex logic (Math.min/max) is tricky.
    // The previous service used a calculated value. To do this safely, we should probably read-modify-write inside transaction,
    // or trust the passed values if they are pre-calculated.
    // But mastery is cumulative.
    // Let's rely on the service to calculate the NEW TOTAL mastery, OR fetch here.
    // The previous code did: mastery_form: Math.max(0, Math.min(100, vocab.mastery_form + delta))
    // This implies we need the current value.
    // I will fetch the current item inside the transaction to ensure consistency?
    // Or assume the UseCase already fetched it (optimistic concurrency).
    // Let's implement the atomic logic here.

    const updatedVocab = await this.prisma.$transaction(async (tx) => {
      // 1. Create Attempt
      await tx.vocab_attempts.create({
        data: {
          id: attempt.id,
          vocab_id: attempt.vocabId,
          session_id: attempt.sessionId,
          dimension: attempt.dimension,
          result: attempt.result,
        },
      });

      // 2. Fetch current for mastery calculation
      const current = await tx.user_vocabularies.findUniqueOrThrow({
        where: { id },
      });

      const newDetails: any = {
        srs_stage: srsStage,
        due_at: dueAt,
        lapses_count: { increment: lapsesIncrement },
        last_seen_at: new Date(),
      };

      if (dimension === "FORM") {
        newDetails.mastery_form = Math.max(
          0,
          Math.min(100, current.mastery_form + masteryDelta),
        );
      } else if (dimension === "MEANING") {
        newDetails.mastery_meaning = Math.max(
          0,
          Math.min(100, current.mastery_meaning + masteryDelta),
        );
      } else if (dimension === "USE") {
        newDetails.mastery_use = Math.max(
          0,
          Math.min(100, current.mastery_use + masteryDelta),
        );
      }

      const updated = await tx.user_vocabularies.update({
        where: { id },
        data: newDetails,
        include: {
          contents: { select: { id: true, title: true } },
        },
      });
      return updated;
    });

    return this.mapVocabToDomain(updatedVocab);
  }

  private mapVocabToDomain(item: any): Vocabulary {
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
