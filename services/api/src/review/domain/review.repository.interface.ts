import { Vocabulary } from "../../vocab/domain/vocabulary.entity";
import { VocabAttempt } from "./vocab-attempt.entity";
import { VocabDimension, AttemptResult, SrsStage } from "@prisma/client";

export interface IReviewRepository {
  findDue(userId: string, limit: number): Promise<Vocabulary[]>;
  countDue(userId: string): Promise<number>;
  
  recordAttemptAndUpdateVocab(
    attempt: VocabAttempt,
    vocabUpdate: {
      id: string;
      srsStage: SrsStage;
      dueAt: Date;
      lapsesIncrement: number;
      masteryDelta: number;
    }
  ): Promise<Vocabulary>;
}

export const IReviewRepository = Symbol("IReviewRepository");
