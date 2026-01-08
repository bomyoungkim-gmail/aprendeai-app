import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgress } from "../../domain/entities/game-progress.entity";
import * as crypto from "crypto";

@Injectable()
export class PrismaGameProgressRepository implements IGameProgressRepository {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string): Promise<GameProgress[]> {
    const progress = await this.prisma.game_progress.findMany({
      where: { user_id: userId },
      orderBy: { total_plays: "desc" },
    });
    return progress.map(this.mapToDomain);
  }

  async findByUserAndGame(
    userId: string,
    gameId: string,
  ): Promise<GameProgress | null> {
    const progress = await this.prisma.game_progress.findFirst({
      where: {
        user_id: userId,
        game_id: gameId,
      },
    });
    return progress ? this.mapToDomain(progress) : null;
  }

  async save(progress: GameProgress): Promise<GameProgress> {
    const data = {
      id: progress.id || crypto.randomUUID(),
      user_id: progress.userId,
      game_id: progress.gameId,
      stars: progress.stars,
      bestScore: progress.bestScore,
      total_plays: progress.totalPlays,
      streak: progress.streak,
      last_played: progress.lastPlayed,
      updated_at: new Date(),
    };

    const existing = await this.prisma.game_progress.findFirst({
      where: {
        user_id: progress.userId,
        game_id: progress.gameId,
      },
    });

    let saved;
    if (existing) {
      saved = await this.prisma.game_progress.update({
        where: { id: existing.id },
        data: data,
      });
    } else {
      saved = await this.prisma.game_progress.create({
        data: { ...data, created_at: progress.createdAt || new Date() },
      });
    }

    return this.mapToDomain(saved);
  }

  private mapToDomain(item: any): GameProgress {
    return new GameProgress({
      id: item.id,
      userId: item.user_id,
      gameId: item.game_id,
      stars: item.stars,
      bestScore: item.bestScore,
      totalPlays: item.total_plays,
      streak: item.streak,
      lastPlayed: item.last_played,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }
}
