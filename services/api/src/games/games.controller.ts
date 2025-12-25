import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GamesService } from "./games.service";
import { GameProgressService } from "./game-progress.service";
import { GameLeaderboardService } from "./game-leaderboard.service";
import { GameCatalogResponse } from "./dto/game.dto";
import {
  UpdateGameProgressDto,
  GameProgressSummary,
  GameProgressDto,
} from "./dto/game-progress.dto";

@Controller("games")
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gameProgressService: GameProgressService,
    private readonly leaderboardService: GameLeaderboardService,
  ) {}

  /**
   * Get games catalog (public endpoint - no auth required)
   */
  @Get()
  async getGames(): Promise<GameCatalogResponse> {
    return this.gamesService.getGamesCatalog();
  }

  @Get("progress")
  @UseGuards(AuthGuard("jwt"))
  async getUserProgress(@Request() req: any): Promise<GameProgressSummary> {
    return this.gameProgressService.getUserProgress(req.user.id);
  }

  @Get("progress/:gameId")
  @UseGuards(AuthGuard("jwt"))
  async getGameProgress(
    @Request() req: any,
    @Param("gameId") gameId: string,
  ): Promise<GameProgressDto | null> {
    return this.gameProgressService.getGameProgress(req.user.id, gameId);
  }

  @Post("progress/:gameId")
  @UseGuards(AuthGuard("jwt"))
  async updateGameProgress(
    @Request() req: any,
    @Param("gameId") gameId: string,
    @Body() update: UpdateGameProgressDto,
  ): Promise<GameProgressDto> {
    return this.gameProgressService.updateProgress(req.user.id, gameId, update);
  }

  @Get("leaderboard")
  async getLeaderboard() {
    return this.leaderboardService.getGlobalLeaderboard(10);
  }

  @Get("leaderboard/me")
  @UseGuards(AuthGuard("jwt"))
  async getMyRank(@Request() req: any) {
    return this.leaderboardService.getUserRank(req.user.id);
  }
}
