import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameProgressDto, UpdateGameProgressDto, GameProgressSummary } from './dto/game-progress.dto';

@Injectable()
export class GameProgressService {
  private readonly logger = new Logger(GameProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's progress for all games
   */
  async getUserProgress(userId: string): Promise<GameProgressSummary> {
    const progress = await this.prisma.gameProgress.findMany({
      where: { userId },
      orderBy: { totalPlays: 'desc' },
    });

    const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
    const totalGamesPlayed = progress.filter(p => p.totalPlays > 0).length;
    const favoriteGame = progress.length > 0 ? progress[0].gameId : null;
    const currentStreak = Math.max(...progress.map(p => p.streak), 0);

    return {
      totalGamesPlayed,
      totalStars,
      favoriteGame,
      currentStreak,
      gamesProgress: progress.map(this.mapToDto),
    };
  }

  /**
   * Get progress for a specific game
   */
  async getGameProgress(userId: string, gameId: string): Promise<GameProgressDto | null> {
    const progress = await this.prisma.gameProgress.findUnique({
      where: {
        userId_gameId: { userId, gameId },
      },
    });

    return progress ? this.mapToDto(progress) : null;
  }

  /**
   * Update progress after game completion
   */
  async updateProgress(
    userId: string,
    gameId: string,
    update: UpdateGameProgressDto,
  ): Promise<GameProgressDto> {
    const existing = await this.prisma.gameProgress.findUnique({
      where: { userId_gameId: { userId, gameId } },
    });

    const newBestScore = existing
      ? Math.max(existing.bestScore, update.score)
      : update.score;

    const newStreak = update.won
      ? (existing?.streak || 0) + 1
      : 0;

    const newStars = update.stars !== undefined
      ? update.stars
      : this.calculateStars(newBestScore);

    const updated = await this.prisma.gameProgress.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: {
        userId,
        gameId,
        bestScore: update.score,
        stars: newStars,
        totalPlays: 1,
        streak: newStreak,
        lastPlayed: new Date(),
      },
      update: {
        bestScore: newBestScore,
        stars: newStars,
        totalPlays: { increment: 1 },
        streak: newStreak,
        lastPlayed: new Date(),
      },
    });

    this.logger.log(
      `Progress updated for user ${userId}, game ${gameId}: score=${update.score}, stars=${newStars}, streak=${newStreak}`,
    );

    return this.mapToDto(updated);
  }

  /**
   * Calculate stars based on score (0-3 stars)
   */
  private calculateStars(score: number): number {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(progress: any): GameProgressDto {
    return {
      gameId: progress.gameId,
      stars: progress.stars,
      bestScore: progress.bestScore,
      totalPlays: progress.totalPlays,
      streak: progress.streak,
      lastPlayed: progress.lastPlayed,
    };
  }
}
