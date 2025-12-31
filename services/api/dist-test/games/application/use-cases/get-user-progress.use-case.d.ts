import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgressSummary } from "../../dto/game-progress.dto";
export declare class GetUserProgressUseCase {
    private readonly repository;
    constructor(repository: IGameProgressRepository);
    execute(userId: string): Promise<GameProgressSummary>;
}
