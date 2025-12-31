import { HttpService } from "@nestjs/axios";
import { GameCatalogResponse } from "./dto/game.dto";
export declare class GamesService {
    private readonly httpService;
    private readonly logger;
    private readonly AI_SERVICE_URL;
    constructor(httpService: HttpService);
    getGamesCatalog(): Promise<GameCatalogResponse>;
}
