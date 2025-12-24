import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GameMetadata, GameCatalogResponse } from './dto/game.dto';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

  constructor(private readonly httpService: HttpService) {}

  async getGamesCatalog(): Promise<GameCatalogResponse> {
    try {
      // Call Python AI service /games endpoint
      const response = await firstValueFrom(
        this.httpService.get<{ games: GameMetadata[] }>(
          `${this.AI_SERVICE_URL}/games`
        )
      );

      const games = response.data.games;

      this.logger.log(`Fetched ${games.length} games from AI service`);

      return {
        games,
        total: games.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch games from AI service', error);
      throw new Error('Failed to load games catalog');
    }
  }
}
