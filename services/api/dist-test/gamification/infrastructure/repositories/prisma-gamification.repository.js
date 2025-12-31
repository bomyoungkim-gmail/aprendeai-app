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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaGamificationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const game_result_entity_1 = require("../../domain/game-result.entity");
const streak_entity_1 = require("../../domain/streak.entity");
const uuid_1 = require("uuid");
let PrismaGamificationRepository = class PrismaGamificationRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGameResult(data) {
        const created = await this.prisma.game_results.create({
            data: {
                id: data.id || (0, uuid_1.v4)(),
                user_id: data.userId,
                content_id: data.contentId,
                game_type: data.gameType,
                score: data.score,
                metadata: data.metadata || {},
                played_at: data.playedAt || new Date(),
            },
        });
        return this.mapGameResultToDomain(created);
    }
    async findGameResultsByUser(userId, limit = 10) {
        const results = await this.prisma.game_results.findMany({
            where: { user_id: userId },
            orderBy: { played_at: "desc" },
            take: limit,
        });
        return results.map(this.mapGameResultToDomain);
    }
    async findStreakByUserId(userId) {
        const found = await this.prisma.streaks.findUnique({
            where: { user_id: userId },
        });
        return found ? this.mapStreakToDomain(found) : null;
    }
    async createStreak(data) {
        const created = await this.prisma.streaks.create({
            data: {
                user_id: data.userId,
                current_streak: data.currentStreak || 0,
                best_streak: data.bestStreak || 0,
                last_goal_met_date: data.lastGoalMetDate,
                freeze_tokens: data.freezeTokens || 1,
                updated_at: new Date(),
            },
        });
        return this.mapStreakToDomain(created);
    }
    async updateStreak(userId, data) {
        const updated = await this.prisma.streaks.update({
            where: { user_id: userId },
            data: {
                current_streak: data.currentStreak,
                best_streak: data.bestStreak,
                last_goal_met_date: data.lastGoalMetDate,
                freeze_tokens: data.freezeTokens,
                updated_at: new Date(),
            },
        });
        return this.mapStreakToDomain(updated);
    }
    mapGameResultToDomain(item) {
        return new game_result_entity_1.GameResult({
            id: item.id,
            userId: item.user_id,
            contentId: item.content_id,
            gameType: item.game_type,
            score: item.score,
            metadata: item.metadata,
            playedAt: item.played_at,
        });
    }
    mapStreakToDomain(item) {
        return new streak_entity_1.Streak({
            userId: item.user_id,
            currentStreak: item.current_streak,
            bestStreak: item.best_streak,
            lastGoalMetDate: item.last_goal_met_date,
            freezeTokens: item.freeze_tokens,
            updatedAt: item.updated_at,
        });
    }
};
exports.PrismaGamificationRepository = PrismaGamificationRepository;
exports.PrismaGamificationRepository = PrismaGamificationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaGamificationRepository);
//# sourceMappingURL=prisma-gamification.repository.js.map