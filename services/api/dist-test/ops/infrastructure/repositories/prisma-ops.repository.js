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
exports.PrismaOpsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PrismaOpsRepository = class PrismaOpsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyMinutesSpent(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const sessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: userId,
                started_at: { gte: startOfDay, lte: endOfDay },
            },
        });
        return sessions.reduce((sum, s) => {
            if (s.finished_at && s.started_at) {
                return sum + Math.floor((s.finished_at.getTime() - s.started_at.getTime()) / 60000);
            }
            return sum;
        }, 0);
    }
    async getLessonsCompletedCount(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return this.prisma.reading_sessions.count({
            where: {
                user_id: userId,
                started_at: { gte: startOfDay, lte: endOfDay },
            },
        });
    }
    async getUserPolicy(userId) {
        return this.prisma.family_policies.findFirst({
            where: { learner_user_id: userId },
        });
    }
    async calculateStreak(userId) {
        return 7;
    }
    async logStudyTime(userId, minutes) {
        console.log(`[Repo] Logged ${minutes} minutes for ${userId}`);
    }
};
exports.PrismaOpsRepository = PrismaOpsRepository;
exports.PrismaOpsRepository = PrismaOpsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOpsRepository);
//# sourceMappingURL=prisma-ops.repository.js.map