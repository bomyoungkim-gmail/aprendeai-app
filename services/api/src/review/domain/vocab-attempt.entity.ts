import { VocabDimension, AttemptResult } from "@prisma/client";

export class VocabAttempt {
  id: string;
  vocabId: string;
  sessionId?: string;
  dimension: VocabDimension;
  result: AttemptResult;
  createdAt: Date;

  constructor(partial: Partial<VocabAttempt>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
  }
}
