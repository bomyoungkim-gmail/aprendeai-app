import { Injectable, Inject } from "@nestjs/common";
import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgressSummary, GameProgressDto } from "../../dto/game-progress.dto";

@Injectable()
export class GetUserProgressUseCase {
  constructor(
    @Inject(IGameProgressRepository)
    private readonly repository: IGameProgressRepository,
  ) {}

  async execute(userId: string): Promise<GameProgressSummary> {
    const progress = await this.repository.findByUser(userId);

    const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
    const totalGamesPlayed = progress.filter((p) => p.totalPlays > 0).length;
    const favoriteGame = progress.length > 0 ? progress[0].gameId : null;
    const currentStreak = Math.max(...progress.map((p) => p.streak), 0);

    return {
      totalGamesPlayed,
      totalStars,
      favoriteGame,
      currentStreak,
      gamesProgress: progress.map((p) => ({
        gameId: p.gameId,
        stars: p.stars,
        bestScore: p.bestScore,
        totalPlays: p.totalPlays,
        streak: p.streak,
        lastPlayed: p.lastPlayed,
      })),
    };
  }
}
