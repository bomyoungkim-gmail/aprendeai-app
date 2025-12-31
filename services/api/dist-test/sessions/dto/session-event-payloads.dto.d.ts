export declare class MarkUnknownWordPayloadDto {
    word: string;
    language: "PT" | "EN" | "KO";
    origin: "SKIM" | "READ";
    blockId?: string;
    chunkId?: string;
    page?: number;
    span?: {
        start: number;
        end: number;
    } | string;
    note?: string;
}
export declare class MarkKeyIdeaPayloadDto {
    blockId: string;
    excerpt: string;
    note?: string;
}
export declare class CheckpointResponsePayloadDto {
    blockId: string;
    questionId: string;
    questionText?: string;
    answerText: string;
    confidence?: number;
    rubric?: {
        comprehension?: number;
        inference?: number;
    };
}
export declare class QuizResponsePayloadDto {
    quizId: string;
    questionId: string;
    answerText: string;
    confidence?: number;
}
export declare class ProductionSubmitPayloadDto {
    type: "FREE_RECALL" | "SENTENCES" | "ORAL" | "OPEN_DIALOGUE";
    text: string;
    usedWords?: string[];
    confidence?: number;
}
