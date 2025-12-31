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
exports.PrismaActivityRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const activity_entity_1 = require("../../domain/entities/activity.entity");
const uuid_1 = require("uuid");
let PrismaActivityRepository = class PrismaActivityRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async track(userId, date, data) {
        await this.prisma.daily_activities.upsert({
            where: {
                user_id_date: {
                    user_id: userId,
                    date: date,
                },
            },
            create: {
                id: (0, uuid_1.v4)(),
                user_id: userId,
                date: date,
                minutes_studied: data.minutesStudied || 0,
                sessions_count: data.sessionsCount || 0,
                contents_read: data.contentsRead || 0,
                annotations_created: data.annotationsCreated || 0,
            },
            update: {
                minutes_studied: data.minutesStudied ? { increment: data.minutesStudied } : undefined,
                sessions_count: data.sessionsCount ? { increment: data.sessionsCount } : undefined,
                contents_read: data.contentsRead ? { increment: data.contentsRead } : undefined,
                annotations_created: data.annotationsCreated ? { increment: data.annotationsCreated } : undefined,
            },
        });
    }
    async getActivityHeatmap(userId, days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const activities = await this.prisma.daily_activities.findMany({
            where: {
                user_id: userId,
                date: { gte: startDate },
            },
            orderBy: { date: 'asc' },
        });
        return activities.map(a => new activity_entity_1.Activity(a.id, a.user_id, a.date, a.minutes_studied, a.sessions_count, a.contents_read, a.annotations_created));
    }
    async getActivities(userId, since) {
        const activities = await this.prisma.daily_activities.findMany({
            where: {
                user_id: userId,
                date: { gte: since },
            },
            orderBy: { date: 'desc' },
        });
        return activities.map(a => new activity_entity_1.Activity(a.id, a.user_id, a.date, a.minutes_studied, a.sessions_count, a.contents_read, a.annotations_created));
    }
    async getActiveTopicsCount(userId, since) {
        const topics = await this.prisma.user_topic_mastery.findMany({
            where: {
                user_id: userId,
                last_activity_at: { gte: since },
            },
            select: { topic: true },
            distinct: ['topic'],
        });
        return topics.length;
    }
};
exports.PrismaActivityRepository = PrismaActivityRepository;
exports.PrismaActivityRepository = PrismaActivityRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaActivityRepository);
//# sourceMappingURL=prisma-activity.repository.js.map