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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserProgressUseCase = void 0;
const common_1 = require("@nestjs/common");
const game_progress_repository_interface_1 = require("../../domain/interfaces/game-progress.repository.interface");
let GetUserProgressUseCase = class GetUserProgressUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId) {
        const progress = await this.repository.findByUser(userId);
        const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
        const totalGamesPlayed = progress.filter((p) => p.totalPlays > 0).length;
        const favoriteGame = progress.length > 0 ? progress[0].gameId : null;
        const currentStreak = Math.max(...progress.map((p) => p.streak), 0);
        return {
            totalGamesPlayed,
            totalStars,
            favoriteGame,
            currentStreak,
            gamesProgress: progress.map((p) => ({
                gameId: p.gameId,
                stars: p.stars,
                bestScore: p.bestScore,
                totalPlays: p.totalPlays,
                streak: p.streak,
                lastPlayed: p.lastPlayed,
            })),
        };
    }
};
exports.GetUserProgressUseCase = GetUserProgressUseCase;
exports.GetUserProgressUseCase = GetUserProgressUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(game_progress_repository_interface_1.IGameProgressRepository)),
    __metadata("design:paramtypes", [Object])
], GetUserProgressUseCase);
//# sourceMappingURL=get-user-progress.use-case.js.map