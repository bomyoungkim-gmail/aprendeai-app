import { GamesService } from "./games.service";
import { GameProgressService } from "./game-progress.service";
import { GameLeaderboardService } from "./game-leaderboard.service";
import { GameCatalogResponse } from "./dto/game.dto";
import { UpdateGameProgressDto, GameProgressSummary, GameProgressDto } from "./dto/game-progress.dto";
export declare class GamesController {
    private readonly gamesService;
    private readonly gameProgressService;
    private readonly leaderboardService;
    constructor(gamesService: GamesService, gameProgressService: GameProgressService, leaderboardService: GameLeaderboardService);
    getGames(): Promise<GameCatalogResponse>;
    getUserProgress(req: any): Promise<GameProgressSummary>;
    getGameProgress(req: any, gameId: string): Promise<GameProgressDto | null>;
    updateGameProgress(req: any, gameId: string, update: UpdateGameProgressDto): Promise<GameProgressDto>;
    getLeaderboard(): Promise<{
        leaders: import("./game-leaderboard.service").LeaderboardEntry[];
    }>;
    getMyRank(req: any): Promise<{
        userRank: number | null;
        totalStars: number;
        nearby: import("./game-leaderboard.service").LeaderboardEntry[];
    }>;
}
