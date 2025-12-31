export declare class VocabAttemptDto {
    vocabId: string;
    dimension: "FORM" | "MEANING" | "USE";
    result: "FAIL" | "HARD" | "OK" | "EASY";
    sessionId?: string;
}
export declare class ReviewQueueQueryDto {
    limit?: string;
}
