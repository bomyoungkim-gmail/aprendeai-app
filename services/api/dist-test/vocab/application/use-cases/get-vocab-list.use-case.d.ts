import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
export interface GetVocabListInput {
    userId: string;
    language?: string;
    srsStage?: string;
    dueOnly?: boolean;
}
export declare class GetVocabListUseCase {
    private readonly vocabRepository;
    constructor(vocabRepository: IVocabRepository);
    execute(input: GetVocabListInput): Promise<Vocabulary[]>;
}
