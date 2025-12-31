export interface TabooQuestion {
    targetWord: string;
    forbiddenWords: string[];
}
export interface TabooAnswer {
    type: "criteria";
    requiredKeywords: string[];
    forbiddenKeywords: string[];
    minWords: number;
    maxWords: number;
    validExamples: string[];
    scoring: {
        noForbidden: number;
        hasRequired: number;
        goodLength: number;
        clarity: number;
    };
}
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
export interface FreeRecallQuestion {
    topic: string;
    prompt: string;
    context?: string;
}
export interface FreeRecallAnswer {
    type: "self-assessed";
    topic: string;
    mustMentionConcepts: string[];
    optionalConcepts: string[];
    minWords: number;
    exampleAnswer: string;
    rubric: {
        excellent: {
            description: string;
            minConcepts: number;
            minWords: number;
        };
        good: {
            description: string;
            minConcepts: number;
            minWords: number;
        };
        needs_improvement: {
            description: string;
            minConcepts: number;
            minWords: number;
        };
    };
    aiEvaluationAvailable: boolean;
}
export interface ClozeQuestion {
    sentence: string;
    blanks: Array<{
        id: number;
        position: number;
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
        perBlankCorrect: number;
    };
}
export interface QuizQuestion {
    question: string;
    options: Array<{
        id: string;
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
export interface FeynmanQuestion {
    concept: string;
    targetAudience: string;
    constraints?: string[];
}
export interface FeynmanAnswer extends FreeRecallAnswer {
    type: "self-assessed";
    simplicityKeywords: string[];
    avoidJargon: string[];
}
export type GameQuestion = TabooQuestion | SRSQuestion | FreeRecallQuestion | ClozeQuestion | QuizQuestion | MisconceptionQuestion | FeynmanQuestion;
export type GameAnswer = TabooAnswer | SRSAnswer | FreeRecallAnswer | ClozeAnswer | QuizAnswer | MisconceptionAnswer | FeynmanAnswer;
export type QuestionForGame<T extends string> = T extends "CONCEPT_LINKING" ? TabooQuestion : T extends "SRS_ARENA" ? SRSQuestion : T extends "FREE_RECALL_SCORE" ? FreeRecallQuestion : T extends "CLOZE_SPRINT" ? ClozeQuestion : T extends "PROBLEM_SOLVER" ? QuizQuestion : T extends "MISCONCEPTION_HUNT" ? MisconceptionQuestion : T extends "FEYNMAN_TEACHER" ? FeynmanQuestion : GameQuestion;
export type AnswerForGame<T extends string> = T extends "CONCEPT_LINKING" ? TabooAnswer : T extends "SRS_ARENA" ? SRSAnswer : T extends "FREE_RECALL_SCORE" ? FreeRecallAnswer : T extends "CLOZE_SPRINT" ? ClozeAnswer : T extends "PROBLEM_SOLVER" ? QuizAnswer : T extends "MISCONCEPTION_HUNT" ? MisconceptionAnswer : T extends "FEYNMAN_TEACHER" ? FeynmanAnswer : GameAnswer;
