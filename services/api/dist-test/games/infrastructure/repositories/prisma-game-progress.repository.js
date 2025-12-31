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
exports.PrismaGameProgressRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const game_progress_entity_1 = require("../../domain/entities/game-progress.entity");
const crypto = require("crypto");
let PrismaGameProgressRepository = class PrismaGameProgressRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUser(userId) {
        const progress = await this.prisma.game_progress.findMany({
            where: { user_id: userId },
            orderBy: { total_plays: "desc" },
        });
        return progress.map(this.mapToDomain);
    }
    async findByUserAndGame(userId, gameId) {
        const progress = await this.prisma.game_progress.findUnique({
            where: {
                user_id_game_id: { user_id: userId, game_id: gameId },
            },
        });
        return progress ? this.mapToDomain(progress) : null;
    }
    async save(progress) {
        const data = {
            id: progress.id || crypto.randomUUID(),
            user_id: progress.userId,
            game_id: progress.gameId,
            stars: progress.stars,
            bestScore: progress.bestScore,
            total_plays: progress.totalPlays,
            streak: progress.streak,
            last_played: progress.lastPlayed,
            updated_at: new Date(),
        };
        const saved = await this.prisma.game_progress.upsert({
            where: {
                user_id_game_id: { user_id: progress.userId, game_id: progress.gameId },
            },
            create: Object.assign(Object.assign({}, data), { created_at: progress.createdAt || new Date() }),
            update: data,
        });
        return this.mapToDomain(saved);
    }
    mapToDomain(item) {
        return new game_progress_entity_1.GameProgress({
            id: item.id,
            userId: item.user_id,
            gameId: item.game_id,
            stars: item.stars,
            bestScore: item.bestScore,
            totalPlays: item.total_plays,
            streak: item.streak,
            lastPlayed: item.last_played,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
};
exports.PrismaGameProgressRepository = PrismaGameProgressRepository;
exports.PrismaGameProgressRepository = PrismaGameProgressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaGameProgressRepository);
//# sourceMappingURL=prisma-game-progress.repository.js.map