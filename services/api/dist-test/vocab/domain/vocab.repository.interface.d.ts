import { Vocabulary } from "./vocabulary.entity";
import { Language, SrsStage } from "@prisma/client";
export interface IVocabRepository {
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
}
export declare const IVocabRepository: unique symbol;
