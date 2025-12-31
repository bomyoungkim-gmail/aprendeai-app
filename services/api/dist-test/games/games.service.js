"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GamesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let GamesService = GamesService_1 = class GamesService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(GamesService_1.name);
        this.AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
    }
    async getGamesCatalog() {
        try {
            this.logger.log(`Fetching games from ${this.AI_SERVICE_URL}/games`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.AI_SERVICE_URL}/games`, {
                timeout: 10000,
                headers: {
                    Accept: "application/json",
                },
            }));
            const games = response.data.games;
            const total = response.data.total || games.length;
            this.logger.log(`Successfully fetched ${games.length} games from AI service`);
            return {
                games,
                total,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch games from AI service: ${error.message}`, error.stack);
            return {
                games: [],
                total: 0,
            };
        }
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = GamesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], GamesService);
//# sourceMappingURL=games.service.js.map