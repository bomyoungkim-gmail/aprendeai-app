import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GamificationService } from "../../../gamification/gamification.service";
import { UpdateGameProgressDto, GameProgressDto } from "../../dto/game-progress.dto";
export declare class UpdateGameProgressUseCase {
    private readonly repository;
    private readonly gamificationService;
    private readonly logger;
    constructor(repository: IGameProgressRepository, gamificationService: GamificationService);
    execute(userId: string, gameId: string, update: UpdateGameProgressDto): Promise<GameProgressDto>;
    private calculateStars;
}
