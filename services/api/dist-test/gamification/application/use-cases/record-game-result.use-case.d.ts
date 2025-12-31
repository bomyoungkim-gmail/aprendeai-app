import { IGamificationRepository } from "../../domain/gamification.repository.interface";
import { GameResult } from "../../domain/game-result.entity";
export interface RecordGameResultInput {
    userId: string;
    contentId: string;
    gameType: string;
    score: number;
    metadata?: any;
}
export declare class RecordGameResultUseCase {
    private readonly gamificationRepository;
    constructor(gamificationRepository: IGamificationRepository);
    execute(input: RecordGameResultInput): Promise<GameResult>;
}
