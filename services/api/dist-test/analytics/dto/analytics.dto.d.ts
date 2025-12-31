export declare class ProgressStatsDto {
    vocabularySize: number;
    weakPoints: {
        skill: string;
        errorCount: number;
    }[];
    strongPoints: {
        skill: string;
        successCount: number;
    }[];
}
export declare class VocabularyItemDto {
    word: string;
    language: string;
    masteryScore: number;
}
