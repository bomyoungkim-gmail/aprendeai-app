export class ProgressStatsDto {
  vocabularySize: number;
  weakPoints: { skill: string; errorCount: number }[];
  strongPoints: { skill: string; successCount: number }[];
}

export class VocabularyItemDto {
  word: string;
  language: string;
  masteryScore: number; // 0-100
}
