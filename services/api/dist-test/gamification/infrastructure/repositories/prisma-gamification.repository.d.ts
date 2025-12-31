import { PrismaService } from "../../../prisma/prisma.service";
import { IGamificationRepository } from "../../domain/gamification.repository.interface";
import { GameResult } from "../../domain/game-result.entity";
import { Streak } from "../../domain/streak.entity";
export declare class PrismaGamificationRepository implements IGamificationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createGameResult(data: Partial<GameResult>): Promise<GameResult>;
    findGameResultsByUser(userId: string, limit?: number): Promise<GameResult[]>;
    findStreakByUserId(userId: string): Promise<Streak | null>;
    createStreak(data: Partial<Streak>): Promise<Streak>;
    updateStreak(userId: string, data: Partial<Streak>): Promise<Streak>;
    private mapGameResultToDomain;
    private mapStreakToDomain;
}
