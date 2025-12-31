import { Injectable, Inject } from "@nestjs/common";
import { IGamificationRepository } from "../../domain/gamification.repository.interface";
import { GameResult } from "../../domain/game-result.entity";

export interface RecordGameResultInput {
  userId: string;
  contentId: string;
  gameType: string;
  score: number;
  metadata?: any;
}

@Injectable()
export class RecordGameResultUseCase {
  constructor(
    @Inject(IGamificationRepository) private readonly gamificationRepository: IGamificationRepository,
  ) {}

  async execute(input: RecordGameResultInput): Promise<GameResult> {
    // In future: Add validation logic, Badge Awarding triggers, etc.
    return this.gamificationRepository.createGameResult({
        userId: input.userId,
        contentId: input.contentId,
        gameType: input.gameType,
        score: input.score,
        metadata: input.metadata,
        playedAt: new Date()
    });
  }
}
