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
exports.GetGameProgressUseCase = void 0;
const common_1 = require("@nestjs/common");
const game_progress_repository_interface_1 = require("../../domain/interfaces/game-progress.repository.interface");
let GetGameProgressUseCase = class GetGameProgressUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, gameId) {
        const progress = await this.repository.findByUserAndGame(userId, gameId);
        if (!progress)
            return null;
        return {
            gameId: progress.gameId,
            stars: progress.stars,
            bestScore: progress.bestScore,
            totalPlays: progress.totalPlays,
            streak: progress.streak,
            lastPlayed: progress.lastPlayed,
        };
    }
};
exports.GetGameProgressUseCase = GetGameProgressUseCase;
exports.GetGameProgressUseCase = GetGameProgressUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(game_progress_repository_interface_1.IGameProgressRepository)),
    __metadata("design:paramtypes", [Object])
], GetGameProgressUseCase);
//# sourceMappingURL=get-game-progress.use-case.js.map