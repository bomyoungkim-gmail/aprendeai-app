// ==========================================
// GAME-SPECIFIC QUESTION TYPES
// ==========================================
// Type definitions for questions in each game type

// CONCEPT_LINKING (Taboo)
export interface TabooQuestion {
  targetWord: string;
  forbiddenWords: string[]; // Exactly 4 words
}

export interface TabooAnswer {
  type: "criteria";
  requiredKeywords: string[];
  forbiddenKeywords: string[];
  minWords: number;
  maxWords: number;
  validExamples: string[];
  scoring: {
    noForbidden: number; // Points for not using forbidden words
    hasRequired: number; // Points for including required keywords
    goodLength: number; // Points for appropriate length
    clarity: number; // Bonus points for clarity
  };
}

// SRS_ARENA
export interface SRSQuestion {
  question: string;
  hint?: string;
}

export interface SRSAnswer {
  type: "exact";
  correct: string;
  acceptableVariations: string[];
  keywords: string[];
  scoring: {
    exactMatch: number;
    hasAllKeywords: number;
    hasSomeKeywords: number;
  };
}

// FREE_RECALL_SCORE
export interface FreeRecallQuestion {
  topic: string;
  prompt: string;
  context?: string; // Additional context about the topic
}

export interface FreeRecallAnswer {
  type: "self-assessed";
  topic: string;
  mustMentionConcepts: string[];
  optionalConcepts: string[];
  minWords: number;
  exampleAnswer: string;
  rubric: {
    excellent: { description: string; minConcepts: number; minWords: number };
    good: { description: string; minConcepts: number; minWords: number };
    needs_improvement: {
      description: string;
      minConcepts: number;
      minWords: number;
    };
  };
  aiEvaluationAvailable: boolean;
}

// CLOZE_SPRINT
export interface ClozeQuestion {
  sentence: string; // Sentence with blanks marked as ___
  blanks: Array<{
    id: number;
    position: number; // Word position in sentence
    hint?: string;
  }>;
}

export interface ClozeAnswer {
  type: "cloze";
  blanks: Array<{
    id: number;
    correct: string;
    acceptableVariations: string[];
    caseSensitive: boolean;
  }>;
  scoring: {
    perBlankCorrect: number; // Points per correct blank
  };
}

// PROBLEM_SOLVER (Quiz)
export interface QuizQuestion {
  question: string;
  options: Array<{
    id: string; // 'A', 'B', 'C', 'd'
    text: string;
  }>;
}

export interface QuizAnswer {
  type: "multiple-choice";
  correctId: string;
  explanation?: string;
  scoring: {
    correct: number;
    incorrect: number;
  };
}

// MISCONCEPTION_HUNT
export interface MisconceptionQuestion {
  statements: Array<{
    id: number;
    text: string;
    isWrong: boolean;
  }>;
}

export interface MisconceptionAnswer {
  type: "composite";
  correctWrongId: number;
  explanation: string;
  commonMisconceptions: string[];
  scoring: {
    correctIdentification: number;
    goodExplanation: number;
  };
}

// FEYNMAN_TEACHER
export interface FeynmanQuestion {
  concept: string;
  targetAudience: string; // e.g., "5 years old", "beginner"
  constraints?: string[];
}

export interface FeynmanAnswer extends FreeRecallAnswer {
  type: "self-assessed";
  simplicityKeywords: string[]; // Words that indicate simple explanation
  avoidJargon: string[]; // Technical terms to avoid
}

// Generic type for all questions
export type GameQuestion =
  | TabooQuestion
  | SRSQuestion
  | FreeRecallQuestion
  | ClozeQuestion
  | QuizQuestion
  | MisconceptionQuestion
  | FeynmanQuestion;

export type GameAnswer =
  | TabooAnswer
  | SRSAnswer
  | FreeRecallAnswer
  | ClozeAnswer
  | QuizAnswer
  | MisconceptionAnswer
  | FeynmanAnswer;

// Helper type to get question/answer types by game ID
export type QuestionForGame<T extends string> = T extends "CONCEPT_LINKING"
  ? TabooQuestion
  : T extends "SRS_ARENA"
    ? SRSQuestion
    : T extends "FREE_RECALL_SCORE"
      ? FreeRecallQuestion
      : T extends "CLOZE_SPRINT"
        ? ClozeQuestion
        : T extends "PROBLEM_SOLVER"
          ? QuizQuestion
          : T extends "MISCONCEPTION_HUNT"
            ? MisconceptionQuestion
            : T extends "FEYNMAN_TEACHER"
              ? FeynmanQuestion
              : GameQuestion;

export type AnswerForGame<T extends string> = T extends "CONCEPT_LINKING"
  ? TabooAnswer
  : T extends "SRS_ARENA"
    ? SRSAnswer
    : T extends "FREE_RECALL_SCORE"
      ? FreeRecallAnswer
      : T extends "CLOZE_SPRINT"
        ? ClozeAnswer
        : T extends "PROBLEM_SOLVER"
          ? QuizAnswer
          : T extends "MISCONCEPTION_HUNT"
            ? MisconceptionAnswer
            : T extends "FEYNMAN_TEACHER"
              ? FeynmanAnswer
              : GameAnswer;
