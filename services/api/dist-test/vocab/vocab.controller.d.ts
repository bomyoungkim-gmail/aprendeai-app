import { VocabService } from "./vocab.service";
export declare class VocabController {
    private vocabService;
    constructor(vocabService: VocabService);
    createFromTargets(req: any, sessionId: string): Promise<{
        created: number;
        updated: number;
        vocabItems: import("./domain/vocabulary.entity").Vocabulary[];
    }>;
}
