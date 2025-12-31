import { GameResult } from "./game-result.entity";
import { Streak } from "./streak.entity";

export interface IGamificationRepository {
  // Game Results
  createGameResult(data: Partial<GameResult>): Promise<GameResult>;
  findGameResultsByUser(userId: string, limit?: number): Promise<GameResult[]>;

  // Streaks
  findStreakByUserId(userId: string): Promise<Streak | null>;
  createStreak(data: Partial<Streak>): Promise<Streak>; // or Upsert
  updateStreak(userId: string, data: Partial<Streak>): Promise<Streak>;
}

export const IGamificationRepository = Symbol("IGamificationRepository");
