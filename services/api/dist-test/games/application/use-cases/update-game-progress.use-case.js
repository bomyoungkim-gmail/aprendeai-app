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
var UpdateGameProgressUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGameProgressUseCase = void 0;
const common_1 = require("@nestjs/common");
const game_progress_repository_interface_1 = require("../../domain/interfaces/game-progress.repository.interface");
const gamification_service_1 = require("../../../gamification/gamification.service");
const game_progress_entity_1 = require("../../domain/entities/game-progress.entity");
const crypto = require("crypto");
let UpdateGameProgressUseCase = UpdateGameProgressUseCase_1 = class UpdateGameProgressUseCase {
    constructor(repository, gamificationService) {
        this.repository = repository;
        this.gamificationService = gamificationService;
        this.logger = new common_1.Logger(UpdateGameProgressUseCase_1.name);
    }
    async execute(userId, gameId, update) {
        const existing = await this.repository.findByUserAndGame(userId, gameId);
        const newBestScore = existing
            ? Math.max(existing.bestScore, update.score)
            : update.score;
        const newStreak = update.won ? ((existing === null || existing === void 0 ? void 0 : existing.streak) || 0) + 1 : 0;
        const newStars = update.stars !== undefined
            ? update.stars
            : this.calculateStars(newBestScore);
        const progress = new game_progress_entity_1.GameProgress({
            id: (existing === null || existing === void 0 ? void 0 : existing.id) || crypto.randomUUID(),
            userId,
            gameId,
            stars: newStars,
            bestScore: newBestScore,
            totalPlays: ((existing === null || existing === void 0 ? void 0 : existing.totalPlays) || 0) + 1,
            streak: newStreak,
            lastPlayed: new Date(),
            createdAt: (existing === null || existing === void 0 ? void 0 : existing.createdAt) || new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.repository.save(progress);
        this.logger.log(`Progress updated for user ${userId}, game ${gameId}: score=${update.score}, stars=${newStars}, streak=${newStreak}`);
        const timeSpent = 5;
        const qualityScore = Math.min((newStars / 3) * 100, 100);
        this.gamificationService
            .registerActivity(userId, {
            minutesSpentDelta: timeSpent,
            focusScore: qualityScore,
            activityType: "game",
            lessonsCompletedDelta: update.won ? 1 : 0,
        })
            .catch((e) => this.logger.error(`Failed to register game activity: ${e.message}`));
        return {
            gameId: saved.gameId,
            stars: saved.stars,
            bestScore: saved.bestScore,
            totalPlays: saved.totalPlays,
            streak: saved.streak,
            lastPlayed: saved.lastPlayed,
        };
    }
    calculateStars(score) {
        if (score >= 90)
            return 3;
        if (score >= 70)
            return 2;
        if (score >= 50)
            return 1;
        return 0;
    }
};
exports.UpdateGameProgressUseCase = UpdateGameProgressUseCase;
exports.UpdateGameProgressUseCase = UpdateGameProgressUseCase = UpdateGameProgressUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(game_progress_repository_interface_1.IGameProgressRepository)),
    __metadata("design:paramtypes", [Object, gamification_service_1.GamificationService])
], UpdateGameProgressUseCase);
//# sourceMappingURL=update-game-progress.use-case.js.map