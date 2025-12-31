import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { Language } from "@prisma/client";
export interface AddVocabItem {
    word: string;
    language: Language;
    contentId?: string;
    exampleNote?: string;
    meaningNote?: string;
}
export interface AddVocabListOutput {
    createdCount: number;
    updatedCount: number;
    items: Vocabulary[];
}
export declare class AddVocabListUseCase {
    private readonly vocabRepository;
    constructor(vocabRepository: IVocabRepository);
    execute(userId: string, items: AddVocabItem[]): Promise<AddVocabListOutput>;
    private normalizeWord;
}
