import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { GameMetadata, GameCatalogResponse } from "./dto/game.dto";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || "http://localhost:8001";

  constructor(private readonly httpService: HttpService) {}

  async getGamesCatalog(): Promise<GameCatalogResponse> {
    try {
      this.logger.log(`Fetching games from ${this.AI_SERVICE_URL}/games`);

      // Call Python AI service /games endpoint with timeout
      const response = await firstValueFrom(
        this.httpService.get<{ games: GameMetadata[]; total: number }>(
          `${this.AI_SERVICE_URL}/games`,
          {
            timeout: 10000, // 10 seconds
            headers: {
              Accept: "application/json",
            },
          },
        ),
      );

      const games = response.data.games;
      const total = response.data.total || games.length;

      this.logger.log(
        `Successfully fetched ${games.length} games from AI service`,
      );

      return {
        games,
        total,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch games from AI service: ${error.message}`,
        error.stack,
      );

      // Return empty array instead of throwing to allow frontend fallback
      return {
        games: [],
        total: 0,
      };
    }
  }
}
