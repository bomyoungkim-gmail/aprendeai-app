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
exports.PrismaAnalyticsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const study_session_entity_1 = require("../../domain/study-session.entity");
let PrismaAnalyticsRepository = class PrismaAnalyticsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(session) {
        const created = await this.prisma.study_sessions.create({
            data: {
                id: session.id,
                user_id: session.userId,
                activity_type: session.activityType,
                content_id: session.contentId,
                source_id: session.sourceId,
                start_time: session.startTime,
            },
        });
        return this.mapToDomain(created);
    }
    async updateSession(id, updates) {
        const updated = await this.prisma.study_sessions.update({
            where: { id },
            data: {
                end_time: updates.endTime,
                duration_minutes: updates.durationMinutes,
                net_focus_minutes: updates.netFocusMinutes,
                interruptions: updates.interruptions ? { increment: 1 } : undefined,
                focus_score: updates.focusScore,
                accuracy_rate: updates.accuracyRate,
                engagement_score: updates.engagementScore,
            },
        });
        return this.mapToDomain(updated);
    }
    async incrementInterruptions(id) {
        await this.prisma.study_sessions.update({
            where: { id },
            data: { interruptions: { increment: 1 } }
        });
    }
    async findById(id) {
        const found = await this.prisma.study_sessions.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findActiveSession(userId, activityType) {
        const found = await this.prisma.study_sessions.findFirst({
            where: {
                user_id: userId,
                activity_type: activityType,
                end_time: null,
            },
            orderBy: { start_time: "desc" },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findAbandonedSessions(thresholdMinutes) {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        const found = await this.prisma.study_sessions.findMany({
            where: {
                end_time: null,
                start_time: { lt: threshold },
            },
        });
        return found.map(this.mapToDomain);
    }
    async findReadingSession(userId, contentId) {
        const found = await this.prisma.study_sessions.findFirst({
            where: {
                user_id: userId,
                content_id: contentId,
                activity_type: "reading",
                end_time: null,
            },
            orderBy: { start_time: "desc" },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async countMasteredVocab(userId, minMastery) {
        return this.prisma.user_vocabularies.count({
            where: { user_id: userId, mastery_score: { gte: minMastery } },
        });
    }
    async getAssessmentAnswers(userId) {
        return this.prisma.assessment_answers.findMany({
            where: { assessment_attempts: { user_id: userId } },
            include: { assessment_questions: true },
        });
    }
    async getVocabularyList(userId, limit) {
        return this.prisma.user_vocabularies.findMany({
            where: { user_id: userId },
            orderBy: { mastery_score: "desc" },
            take: limit,
        });
    }
    async getHourlyPerformance(userId, since) {
        return this.prisma.$queryRaw `
      SELECT 
        EXTRACT(HOUR FROM start_time)::integer AS hour,
        AVG(accuracy_rate)::float AS avg_accuracy,
        AVG(focus_score)::float AS avg_focus_score,
        COUNT(*)::bigint AS total_sessions,
        SUM(duration_minutes)::bigint AS total_minutes
      FROM study_sessions
      WHERE user_id = ${userId}
        AND start_time >= ${since}
        AND duration_minutes IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY hour
    `;
    }
    async getQualitySessions(userId, since) {
        return this.prisma.study_sessions.findMany({
            where: {
                user_id: userId,
                start_time: { gte: since },
            },
        });
    }
    mapToDomain(item) {
        return new study_session_entity_1.StudySession({
            id: item.id,
            userId: item.user_id,
            activityType: item.activity_type,
            contentId: item.content_id,
            sourceId: item.source_id,
            startTime: item.start_time,
            endTime: item.end_time,
            durationMinutes: item.duration_minutes,
            netFocusMinutes: item.net_focus_minutes,
            interruptions: item.interruptions,
            focusScore: item.focus_score,
            accuracyRate: item.accuracy_rate,
            engagementScore: item.engagement_score,
        });
    }
};
exports.PrismaAnalyticsRepository = PrismaAnalyticsRepository;
exports.PrismaAnalyticsRepository = PrismaAnalyticsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAnalyticsRepository);
//# sourceMappingURL=prisma-analytics.repository.js.map