import { VocabDimension, AttemptResult } from "@prisma/client";
export declare class VocabAttempt {
    id: string;
    vocabId: string;
    sessionId?: string;
    dimension: VocabDimension;
    result: AttemptResult;
    createdAt: Date;
    constructor(partial: Partial<VocabAttempt>);
}
