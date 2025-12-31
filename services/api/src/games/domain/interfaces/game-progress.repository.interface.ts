import { GameProgress } from "../entities/game-progress.entity";

export const IGameProgressRepository = "IGameProgressRepository";

export interface IGameProgressRepository {
  findByUser(userId: string): Promise<GameProgress[]>;
  findByUserAndGame(userId: string, gameId: string): Promise<GameProgress | null>;
  save(progress: GameProgress): Promise<GameProgress>;
}
