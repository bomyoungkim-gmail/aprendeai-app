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
var QuestionAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
const topic_mastery_service_1 = require("../../analytics/topic-mastery.service");
const crypto = require("crypto");
let QuestionAnalyticsService = QuestionAnalyticsService_1 = class QuestionAnalyticsService {
    constructor(prisma, topicMastery, eventEmitter) {
        this.prisma = prisma;
        this.topicMastery = topicMastery;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(QuestionAnalyticsService_1.name);
        this.activeGameSessions = new Map();
    }
    async recordResult(userId, dto) {
        const { questionId, score, timeTaken, isCorrect, selfRating, userAnswer, mistakes, gameSessionId, } = dto;
        await this.trackGameSession(userId, gameSessionId, questionId, isCorrect, timeTaken);
        const result = await this.prisma.question_results.create({
            data: {
                id: crypto.randomUUID(),
                user_id: userId,
                question_id: questionId,
                score,
                time_taken: timeTaken,
                is_correct: isCorrect,
                self_rating: selfRating,
                user_answer: userAnswer || {},
                mistakes: mistakes || {},
                game_session_id: gameSessionId,
            },
        });
        const question = await this.prisma.question_bank.findUnique({
            where: { id: questionId },
            select: { topic: true, subject: true },
        });
        const promises = [
            this.updateQuestionStats(questionId, score, timeTaken, isCorrect, selfRating),
        ];
        if (question) {
            promises.push(this.topicMastery.updateMastery(userId, question.topic, question.subject, isCorrect, timeTaken));
        }
        await Promise.all(promises);
        const analytics = await this.prisma.question_analytics.findUnique({
            where: { question_id: questionId },
        });
        return {
            id: result.id,
            userId: result.user_id,
            questionId: result.question_id,
            score: result.score,
            timeTaken: result.time_taken,
            isCorrect: result.is_correct,
            selfRating: result.self_rating,
            createdAt: result.created_at,
            questionAnalytics: {
                totalAttempts: (analytics === null || analytics === void 0 ? void 0 : analytics.total_attempts) || 1,
                successRate: (analytics === null || analytics === void 0 ? void 0 : analytics.success_rate) || (isCorrect ? 100 : 0),
                avgScore: (analytics === null || analytics === void 0 ? void 0 : analytics.avg_score) || score,
                isDifficult: (analytics === null || analytics === void 0 ? void 0 : analytics.is_difficult) || false,
            },
            nextReviewDate: selfRating
                ? this.calculateNextReview(selfRating)
                : undefined,
        };
    }
    async trackGameSession(userId, gameSessionId, questionId, isCorrect, timeTaken) {
        if (!gameSessionId)
            return;
        const sessionKey = `${userId}-${gameSessionId}`;
        let sessionData = this.activeGameSessions.get(sessionKey);
        if (!sessionData) {
            this.eventEmitter.emit("session.started", {
                userId,
                activityType: "game",
                sourceId: gameSessionId,
            });
            sessionData = {
                sessionId: "",
                startTime: new Date(),
                questionsCount: 0,
            };
            this.activeGameSessions.set(sessionKey, sessionData);
        }
        sessionData.questionsCount++;
        const idleTime = Date.now() - sessionData.startTime.getTime();
        if (sessionData.questionsCount >= 10 || idleTime > 15 * 60 * 1000) {
            const durationMinutes = Math.floor(idleTime / (1000 * 60));
            this.eventEmitter.emit("session.finished", {
                sessionId: gameSessionId,
                durationMinutes,
                accuracyRate: isCorrect ? 100 : 0,
            });
            this.activeGameSessions.delete(sessionKey);
        }
    }
    async updateQuestionStats(questionId, score, timeTaken, isCorrect, selfRating) {
        try {
            const analytics = await this.prisma.question_analytics.findUnique({
                where: { question_id: questionId },
            });
            if (!analytics) {
                await this.prisma.question_analytics.create({
                    data: {
                        id: crypto.randomUUID(),
                        question_id: questionId,
                        total_attempts: 1,
                        success_rate: isCorrect ? 100 : 0,
                        avg_score: score,
                        avg_time: timeTaken,
                        avg_self_rating: selfRating || null,
                        common_mistakes: [],
                        is_difficult: !isCorrect,
                        updated_at: new Date(),
                    },
                });
            }
            else {
                const total = analytics.total_attempts + 1;
                const newAvgScore = (analytics.avg_score * analytics.total_attempts +
                    score) /
                    total;
                const newAvgTime = (analytics.avg_time * analytics.total_attempts +
                    timeTaken) /
                    total;
                const successes = (analytics.success_rate / 100) *
                    analytics.total_attempts +
                    (isCorrect ? 1 : 0);
                const newSuccessRate = (successes / total) * 100;
                await this.prisma.question_analytics.update({
                    where: { question_id: questionId },
                    data: {
                        total_attempts: total,
                        avg_score: newAvgScore,
                        avg_time: Math.round(newAvgTime),
                        success_rate: newSuccessRate,
                        is_difficult: newSuccessRate < 40,
                        updated_at: new Date(),
                    },
                });
            }
            await this.prisma.question_bank.update({
                where: { id: questionId },
                data: {
                    times_used: { increment: 1 },
                    avg_score: score,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to update stats for question ${questionId}: ${error.message}`);
        }
    }
    calculateNextReview(rating) {
        const now = new Date();
        switch (rating) {
            case 1:
                return new Date(now.setDate(now.getDate() + 1));
            case 2:
                return new Date(now.setDate(now.getDate() + 3));
            case 3:
                return new Date(now.setDate(now.getDate() + 7));
            default:
                return new Date(now.setDate(now.getDate() + 1));
        }
    }
};
exports.QuestionAnalyticsService = QuestionAnalyticsService;
exports.QuestionAnalyticsService = QuestionAnalyticsService = QuestionAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        topic_mastery_service_1.TopicMasteryService,
        event_emitter_1.EventEmitter2])
], QuestionAnalyticsService);
//# sourceMappingURL=question-analytics.service.js.map