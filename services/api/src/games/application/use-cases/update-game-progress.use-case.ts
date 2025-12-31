import { Injectable, Inject, Logger } from "@nestjs/common";
import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GamificationService } from "../../../gamification/gamification.service";
import { UpdateGameProgressDto, GameProgressDto } from "../../dto/game-progress.dto";
import { GameProgress } from "../../domain/entities/game-progress.entity";
import * as crypto from "crypto";

@Injectable()
export class UpdateGameProgressUseCase {
  private readonly logger = new Logger(UpdateGameProgressUseCase.name);

  constructor(
    @Inject(IGameProgressRepository)
    private readonly repository: IGameProgressRepository,
    private readonly gamificationService: GamificationService,
  ) {}

  async execute(
    userId: string,
    gameId: string,
    update: UpdateGameProgressDto,
  ): Promise<GameProgressDto> {
    const existing = await this.repository.findByUserAndGame(userId, gameId);

    const newBestScore = existing
      ? Math.max(existing.bestScore, update.score)
      : update.score;

    const newStreak = update.won ? (existing?.streak || 0) + 1 : 0;

    const newStars =
      update.stars !== undefined
        ? update.stars
        : this.calculateStars(newBestScore); // Or calculate based on update.score if bestScore not relevant for stars? 
        // Original logic: calculateStars(newBestScore).

    const progress = new GameProgress({
      id: existing?.id || crypto.randomUUID(),
      userId,
      gameId,
      stars: newStars,
      bestScore: newBestScore,
      totalPlays: (existing?.totalPlays || 0) + 1,
      streak: newStreak,
      lastPlayed: new Date(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.repository.save(progress);

    this.logger.log(
      `Progress updated for user ${userId}, game ${gameId}: score=${update.score}, stars=${newStars}, streak=${newStreak}`,
    );

    // Sync with Gamification
    const timeSpent = 5; 
    const qualityScore = Math.min((newStars / 3) * 100, 100);

    this.gamificationService
      .registerActivity(userId, {
        minutesSpentDelta: timeSpent,
        focusScore: qualityScore,
        activityType: "game",
        lessonsCompletedDelta: update.won ? 1 : 0,
      })
      .catch((e) =>
        this.logger.error(`Failed to register game activity: ${e.message}`),
      );

    return {
      gameId: saved.gameId,
      stars: saved.stars,
      bestScore: saved.bestScore,
      totalPlays: saved.totalPlays,
      streak: saved.streak,
      lastPlayed: saved.lastPlayed,
    };
  }

  private calculateStars(score: number): number {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  }
}
