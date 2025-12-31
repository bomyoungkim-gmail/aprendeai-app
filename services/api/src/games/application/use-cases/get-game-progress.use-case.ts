import { Injectable, Inject } from "@nestjs/common";
import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgressDto } from "../../dto/game-progress.dto";

@Injectable()
export class GetGameProgressUseCase {
  constructor(
    @Inject(IGameProgressRepository)
    private readonly repository: IGameProgressRepository,
  ) {}

  async execute(userId: string, gameId: string): Promise<GameProgressDto | null> {
    const progress = await this.repository.findByUserAndGame(userId, gameId);
    if (!progress) return null;

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
