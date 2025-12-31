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
var GameLeaderboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GameLeaderboardService = GameLeaderboardService_1 = class GameLeaderboardService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GameLeaderboardService_1.name);
    }
    async getGlobalLeaderboard(limit = 10) {
        const results = await this.prisma.game_progress.groupBy({
            by: ["user_id"],
            _sum: {
                stars: true,
            },
            orderBy: {
                _sum: {
                    stars: "desc",
                },
            },
            take: limit,
        });
        const userIds = results.map((r) => r.user_id);
        const users = await this.prisma.users.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                avatar_url: true,
            },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const leaders = results
            .map((result, index) => {
            const user = userMap.get(result.user_id);
            if (!user)
                return null;
            return {
                rank: index + 1,
                userId: result.user_id,
                userName: user.name,
                totalStars: result._sum.stars || 0,
                avatar_url: user.avatar_url,
            };
        })
            .filter((entry) => entry !== null);
        this.logger.log(`Fetched leaderboard with ${leaders.length} entries`);
        return { leaders };
    }
    async getUserRank(userId) {
        const userProgress = await this.prisma.game_progress.aggregate({
            where: { user_id: userId },
            _sum: { stars: true },
        });
        const totalStars = userProgress._sum.stars || 0;
        const allResults = await this.prisma.game_progress.groupBy({
            by: ["user_id"],
            _sum: { stars: true },
            orderBy: { _sum: { stars: "desc" } },
        });
        const userRank = allResults.findIndex((r) => r.user_id === userId) + 1;
        const startIndex = Math.max(0, userRank - 3);
        const nearbyResults = allResults.slice(startIndex, startIndex + 5);
        const userIds = nearbyResults.map((r) => r.user_id);
        const users = await this.prisma.users.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, avatar_url: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const nearby = nearbyResults
            .map((result, index) => {
            const user = userMap.get(result.user_id);
            if (!user)
                return null;
            return {
                rank: startIndex + index + 1,
                userId: result.user_id,
                userName: user.name,
                totalStars: result._sum.stars || 0,
                avatar_url: user.avatar_url,
            };
        })
            .filter((entry) => entry !== null);
        return {
            userRank: userRank || null,
            totalStars,
            nearby,
        };
    }
};
exports.GameLeaderboardService = GameLeaderboardService;
exports.GameLeaderboardService = GameLeaderboardService = GameLeaderboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GameLeaderboardService);
//# sourceMappingURL=game-leaderboard.service.js.map