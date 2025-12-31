import { GameProgressDto, UpdateGameProgressDto, GameProgressSummary } from "./dto/game-progress.dto";
import { GetUserProgressUseCase } from "./application/use-cases/get-user-progress.use-case";
import { GetGameProgressUseCase } from "./application/use-cases/get-game-progress.use-case";
import { UpdateGameProgressUseCase } from "./application/use-cases/update-game-progress.use-case";
export declare class GameProgressService {
    private readonly getUserProgressUseCase;
    private readonly getGameProgressUseCase;
    private readonly updateGameProgressUseCase;
    constructor(getUserProgressUseCase: GetUserProgressUseCase, getGameProgressUseCase: GetGameProgressUseCase, updateGameProgressUseCase: UpdateGameProgressUseCase);
    getUserProgress(userId: string): Promise<GameProgressSummary>;
    getGameProgress(userId: string, gameId: string): Promise<GameProgressDto | null>;
    updateProgress(userId: string, gameId: string, update: UpdateGameProgressDto): Promise<GameProgressDto>;
}
