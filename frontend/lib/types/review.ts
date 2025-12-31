export type ReviewDimension = "FORM" | "MEANING" | "USE";
export type ReviewResult = "FAIL" | "HARD" | "OK" | "EASY";

export interface VocabItem {
  id: string;
  word: string;
  translation?: string;
  exampleSentence?: string;
  dimension: ReviewDimension;
  nextReviewAt: string;
}

export interface ReviewQueueItem {
  vocabId: string;
  word: string;
  dimension: ReviewDimension;
  front: string;
  back: string;
  example?: string;
}

export interface VocabAttemptDto {
  vocabId: string;
  dimension: ReviewDimension;
  result: ReviewResult;
  sessionId?: string;
}
