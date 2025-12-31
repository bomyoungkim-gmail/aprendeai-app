import { PrismaService } from "../prisma/prisma.service";
import { GetVocabListUseCase } from "./application/use-cases/get-vocab-list.use-case";
import { AddVocabListUseCase } from "./application/use-cases/add-vocab-list.use-case";
export declare class VocabService {
    private prisma;
    private readonly getVocabListUseCase;
    private readonly addVocabListUseCase;
    constructor(prisma: PrismaService, getVocabListUseCase: GetVocabListUseCase, addVocabListUseCase: AddVocabListUseCase);
    normalizeWord(word: string): string;
    createFromTargetWords(sessionId: string): Promise<{
        created: number;
        updated: number;
        vocabItems: import("./domain/vocabulary.entity").Vocabulary[];
    }>;
    createFromUnknownWords(sessionId: string): Promise<{
        created: number;
        vocabItems: import("./domain/vocabulary.entity").Vocabulary[];
    }>;
    getUserVocab(userId: string, filters?: {
        language?: string;
        srsStage?: string;
        dueOnly?: boolean;
    }): Promise<import("./domain/vocabulary.entity").Vocabulary[]>;
}
