/**
 * Games API Schemas
 * 
 * Zod schemas for validating Games API responses and payloads.
 */

import { z } from 'zod';

// ========================================
// QUESTION SCHEMAS
// ========================================

export const GameQuestionTypeSchema = z.enum([
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'OPEN_ENDED',
  'FLASHCARD'
]);

export const GameQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: GameQuestionTypeSchema,
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(5),
});

export const GameQuestionsArraySchema = z.array(GameQuestionSchema);

// ========================================
// RESULT SCHEMAS
// ========================================

export const GameResultSchema = z.object({
  score: z.number().min(0).max(100),
  totalQuestions: z.number().int().min(1),
  correctCount: z.number().int().min(0),
  timeSpentSeconds: z.number().positive(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const SubmitResultPayloadSchema = z.object({
  questionId: z.string(),
  score: z.number().min(0).max(100),
  timeTaken: z.number().min(0),
  isCorrect: z.boolean(),
  mistakes: z.record(z.string(), z.unknown()).optional(),
  userAnswer: z.unknown().optional(),
});

// ========================================
// PROGRESS SCHEMAS
// ========================================

export const GameProgressSchema = z.object({
  gameId: z.string(),
  totalPlayed: z.number().int().min(0),
  averageScore: z.number().min(0).max(100),
  bestScore: z.number().min(0).max(100),
  lastPlayedAt: z.string().datetime().optional(),
});

export const AllGamesProgressSchema = z.array(GameProgressSchema);

// ========================================
// CATALOG SCHEMAS
// ========================================

export const GameCatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.number().min(1).max(5),
  estimatedTime: z.number().positive(),
  isLocked: z.boolean().optional(),
});

export const GameCatalogSchema = z.array(GameCatalogItemSchema);

// ========================================
// FETCH QUESTIONS PAYLOAD
// ========================================

export const FetchQuestionsPayloadSchema = z.object({
  gameType: z.string(),
  topic: z.string().optional(),
  subject: z.string().optional(),
  educationLevel: z.string().optional(),
  count: z.number().int().positive().optional(),
  language: z.string().optional(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type GameQuestionType = z.infer<typeof GameQuestionTypeSchema>;
export type GameQuestion = z.infer<typeof GameQuestionSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type SubmitResultPayload = z.infer<typeof SubmitResultPayloadSchema>;
export type GameProgress = z.infer<typeof GameProgressSchema>;
export type GameCatalogItem = z.infer<typeof GameCatalogItemSchema>;
export type FetchQuestionsPayload = z.infer<typeof FetchQuestionsPayloadSchema>;
