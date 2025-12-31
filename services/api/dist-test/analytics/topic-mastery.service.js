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
var TopicMasteryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicMasteryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TopicMasteryService = TopicMasteryService_1 = class TopicMasteryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TopicMasteryService_1.name);
    }
    async updateMastery(userId, topic, subject, isCorrect, timeSpentSeconds = 0) {
        try {
            const masteryRecord = await this.prisma.user_topic_mastery.findUnique({
                where: { user_id_topic_subject: { user_id: userId, topic, subject } },
            });
            let newMastery = (masteryRecord === null || masteryRecord === void 0 ? void 0 : masteryRecord.mastery_level) || 0;
            const newStreak = isCorrect ? ((masteryRecord === null || masteryRecord === void 0 ? void 0 : masteryRecord.streak) || 0) + 1 : 0;
            if (isCorrect) {
                const gain = 5 + Math.min(newStreak, 5);
                newMastery = Math.min(100, newMastery + gain);
            }
            else {
                newMastery = Math.max(0, newMastery - 2);
            }
            const { v4: uuidv4 } = require("uuid");
            await this.prisma.user_topic_mastery.upsert({
                where: { user_id_topic_subject: { user_id: userId, topic, subject } },
                create: {
                    id: uuidv4(),
                    user_id: userId,
                    topic,
                    subject,
                    mastery_level: newMastery,
                    streak: newStreak,
                    questions_attempted: 1,
                    questions_correct: isCorrect ? 1 : 0,
                    time_spent: timeSpentSeconds,
                    updated_at: new Date(),
                },
                update: {
                    mastery_level: newMastery,
                    streak: newStreak,
                    questions_attempted: { increment: 1 },
                    questions_correct: { increment: isCorrect ? 1 : 0 },
                    time_spent: { increment: timeSpentSeconds },
                    last_activity_at: new Date(),
                    updated_at: new Date(),
                },
            });
            this.logger.debug(`Updated mastery for user ${userId} on ${topic}: ${newMastery}%`);
        }
        catch (error) {
            this.logger.error(`Failed to update topic mastery for user ${userId}: ${error.message}`);
        }
    }
    async getUserMastery(userId) {
        return this.prisma.user_topic_mastery.findMany({
            where: { user_id: userId },
            orderBy: { last_activity_at: "desc" },
        });
    }
    async getWeakestTopics(userId, limit = 5) {
        return this.prisma.user_topic_mastery.findMany({
            where: {
                user_id: userId,
                mastery_level: { lt: 70 },
            },
            orderBy: [
                { mastery_level: "asc" },
                { last_activity_at: "asc" },
            ],
            take: limit,
        });
    }
};
exports.TopicMasteryService = TopicMasteryService;
exports.TopicMasteryService = TopicMasteryService = TopicMasteryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopicMasteryService);
//# sourceMappingURL=topic-mastery.service.js.map