import { PrismaService } from "../../../prisma/prisma.service";
import { IReviewRepository } from "../../domain/review.repository.interface";
import { Vocabulary } from "../../../vocab/domain/vocabulary.entity";
import { VocabAttempt } from "../../domain/vocab-attempt.entity";
import { SrsStage } from "@prisma/client";
export declare class PrismaReviewRepository implements IReviewRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findDue(userId: string, limit: number): Promise<Vocabulary[]>;
    countDue(userId: string): Promise<number>;
    recordAttemptAndUpdateVocab(attempt: VocabAttempt, vocabUpdate: {
        id: string;
        srsStage: SrsStage;
        dueAt: Date;
        lapsesIncrement: number;
        masteryDelta: number;
    }): Promise<Vocabulary>;
    private mapVocabToDomain;
}
