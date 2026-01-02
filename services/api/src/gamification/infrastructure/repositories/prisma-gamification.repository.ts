import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IGamificationRepository } from "../../domain/gamification.repository.interface";
import { GameResult } from "../../domain/game-result.entity";
import { Streak } from "../../domain/streak.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PrismaGamificationRepository implements IGamificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Game Results ---
  async createGameResult(data: Partial<GameResult>): Promise<GameResult> {
    const created = await this.prisma.game_results.create({
      data: {
        id: data.id || uuidv4(),
        user_id: data.userId!,
        content_id: data.contentId!,
        game_type: data.gameType!,
        score: data.score!,
        metadata: data.metadata || {},
        played_at: data.playedAt || new Date(),
      },
    });
    return this.mapGameResultToDomain(created);
  }

  async findGameResultsByUser(
    userId: string,
    limit = 10,
  ): Promise<GameResult[]> {
    const results = await this.prisma.game_results.findMany({
      where: { user_id: userId },
      orderBy: { played_at: "desc" },
      take: limit,
    });
    return results.map(this.mapGameResultToDomain);
  }

  // --- Streaks ---
  async findStreakByUserId(userId: string): Promise<Streak | null> {
    const found = await this.prisma.streaks.findUnique({
      where: { user_id: userId },
    });
    return found ? this.mapStreakToDomain(found) : null;
  }

  async createStreak(data: Partial<Streak>): Promise<Streak> {
    const created = await this.prisma.streaks.create({
      data: {
        user_id: data.userId!,
        current_streak: data.currentStreak || 0,
        best_streak: data.bestStreak || 0,
        last_goal_met_date: data.lastGoalMetDate,
        freeze_tokens: data.freezeTokens || 1,
        updated_at: new Date(),
      },
    });
    return this.mapStreakToDomain(created);
  }

  async updateStreak(userId: string, data: Partial<Streak>): Promise<Streak> {
    const updated = await this.prisma.streaks.update({
      where: { user_id: userId },
      data: {
        current_streak: data.currentStreak,
        best_streak: data.bestStreak,
        last_goal_met_date: data.lastGoalMetDate,
        freeze_tokens: data.freezeTokens,
        updated_at: new Date(),
      },
    });
    return this.mapStreakToDomain(updated);
  }

  // --- Mappers ---
  private mapGameResultToDomain(item: any): GameResult {
    return new GameResult({
      id: item.id,
      userId: item.user_id,
      contentId: item.content_id,
      gameType: item.game_type,
      score: item.score,
      metadata: item.metadata,
      playedAt: item.played_at,
    });
  }

  private mapStreakToDomain(item: any): Streak {
    return new Streak({
      userId: item.user_id,
      currentStreak: item.current_streak,
      bestStreak: item.best_streak,
      lastGoalMetDate: item.last_goal_met_date,
      freezeTokens: item.freeze_tokens,
      updatedAt: item.updated_at,
    });
  }
}
