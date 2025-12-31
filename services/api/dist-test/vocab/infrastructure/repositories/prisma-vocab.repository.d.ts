import { PrismaService } from "../../../prisma/prisma.service";
import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { Language, SrsStage } from "@prisma/client";
export declare class PrismaVocabRepository implements IVocabRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Partial<Vocabulary>): Promise<Vocabulary>;
    findById(id: string): Promise<Vocabulary | null>;
    findByUserAndWord(userId: string, word: string, language: Language): Promise<Vocabulary | null>;
    upsert(userId: string, word: string, language: Language, createData: Partial<Vocabulary>, updateData: Partial<Vocabulary>): Promise<Vocabulary>;
    findAll(userId: string, filters?: {
        language?: Language;
        srsStage?: SrsStage;
        dueOnly?: boolean;
    }): Promise<Vocabulary[]>;
    countCreatedInBatch(ids: string[]): Promise<number>;
    private mapToDomain;
}
