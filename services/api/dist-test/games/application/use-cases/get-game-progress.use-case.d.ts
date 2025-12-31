import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgressDto } from "../../dto/game-progress.dto";
export declare class GetGameProgressUseCase {
    private readonly repository;
    constructor(repository: IGameProgressRepository);
    execute(userId: string, gameId: string): Promise<GameProgressDto | null>;
}
