import { Injectable } from "@nestjs/common";
import {
  GameProgressDto,
  UpdateGameProgressDto,
  GameProgressSummary,
} from "./dto/game-progress.dto";
import { GetUserProgressUseCase } from "./application/use-cases/get-user-progress.use-case";
import { GetGameProgressUseCase } from "./application/use-cases/get-game-progress.use-case";
import { UpdateGameProgressUseCase } from "./application/use-cases/update-game-progress.use-case";

@Injectable()
export class GameProgressService {
  constructor(
    private readonly getUserProgressUseCase: GetUserProgressUseCase,
    private readonly getGameProgressUseCase: GetGameProgressUseCase,
    private readonly updateGameProgressUseCase: UpdateGameProgressUseCase,
  ) {}

  /**
   * Get user's progress for all games
   */
  async getUserProgress(userId: string): Promise<GameProgressSummary> {
    return this.getUserProgressUseCase.execute(userId);
  }

  /**
   * Get progress for a specific game
   */
  async getGameProgress(
    userId: string,
    gameId: string,
  ): Promise<GameProgressDto | null> {
    return this.getGameProgressUseCase.execute(userId, gameId);
  }

  /**
   * Update progress after game completion
   */
  async updateProgress(
    userId: string,
    gameId: string,
    update: UpdateGameProgressDto,
  ): Promise<GameProgressDto> {
    return this.updateGameProgressUseCase.execute(userId, gameId, update);
  }
}
