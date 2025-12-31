import { GameResult } from "./game-result.entity";
import { Streak } from "./streak.entity";
export interface IGamificationRepository {
    createGameResult(data: Partial<GameResult>): Promise<GameResult>;
    findGameResultsByUser(userId: string, limit?: number): Promise<GameResult[]>;
    findStreakByUserId(userId: string): Promise<Streak | null>;
    createStreak(data: Partial<Streak>): Promise<Streak>;
    updateStreak(userId: string, data: Partial<Streak>): Promise<Streak>;
}
export declare const IGamificationRepository: unique symbol;
