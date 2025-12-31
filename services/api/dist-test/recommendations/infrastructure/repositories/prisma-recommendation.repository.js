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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRecommendationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PrismaRecommendationRepository = class PrismaRecommendationRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getContinueReading(userId) {
        const sessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: userId,
                finished_at: null,
            },
            include: {
                contents: {
                    include: {
                        users_owner: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { started_at: 'desc' },
            take: 3,
        });
        return sessions.map((session) => (Object.assign(Object.assign({}, session.contents), { progress: this.calculateProgress(session) })));
    }
    async getRecentReads(userId) {
        const sessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: userId,
                finished_at: { not: null },
            },
            include: {
                contents: {
                    include: {
                        users_owner: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { finished_at: 'desc' },
            take: 10,
        });
        const seen = new Set();
        const unique = sessions.filter((session) => {
            if (seen.has(session.content_id))
                return false;
            seen.add(session.content_id);
            return true;
        });
        return unique.map((session) => session.contents);
    }
    async getPopularInGroups(userId, groupIds) {
        if (groupIds.length === 0)
            return [];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const popularContent = await this.prisma.contents.findMany({
            where: {
                content_shares: {
                    some: { context_id: { in: groupIds }, context_type: 'STUDY_GROUP' },
                },
                reading_sessions: {
                    some: {
                        started_at: { gte: thirtyDaysAgo },
                    },
                },
            },
            include: {
                users_owner: {
                    select: { id: true, name: true },
                },
                reading_sessions: {
                    where: {
                        user_id: { not: userId },
                        started_at: { gte: thirtyDaysAgo },
                    },
                    select: { id: true, started_at: true },
                },
            },
        });
        const scored = popularContent
            .map((content) => (Object.assign(Object.assign({}, content), { popularity: this.calculatePopularityScore(content.reading_sessions) })))
            .filter((c) => c.reading_sessions.length > 0)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);
        return scored.map((_a) => {
            var { reading_sessions, popularity } = _a, content = __rest(_a, ["reading_sessions", "popularity"]);
            return (Object.assign(Object.assign({}, content), { popularity }));
        });
    }
    async getSimilarContent(userId, types, languages, readIds) {
        const similar = await this.prisma.contents.findMany({
            where: {
                type: { in: types },
                original_language: { in: languages },
                id: { notIn: readIds },
            },
            include: {
                users_owner: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 5,
        });
        return similar;
    }
    async getTrending(userId, readIds) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const trending = await this.prisma.contents.findMany({
            where: {
                id: { notIn: readIds },
                reading_sessions: {
                    some: { started_at: { gte: sevenDaysAgo } },
                },
            },
            include: {
                users_owner: {
                    select: { id: true, name: true },
                },
                reading_sessions: {
                    where: { started_at: { gte: sevenDaysAgo } },
                    select: { id: true, started_at: true },
                },
            },
        });
        const popularTrending = trending
            .filter((c) => c.reading_sessions.length >= 5)
            .map((content) => (Object.assign(Object.assign({}, content), { popularity: this.calculatePopularityScore(content.reading_sessions) })))
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);
        return popularTrending.map((_a) => {
            var { reading_sessions, popularity } = _a, content = __rest(_a, ["reading_sessions", "popularity"]);
            return (Object.assign(Object.assign({}, content), { popularity }));
        });
    }
    calculateProgress(session) {
        const duration = Date.now() - new Date(session.started_at).getTime();
        const estimatedDuration = 30 * 60 * 1000;
        return Math.min(Math.round((duration / estimatedDuration) * 100), 90);
    }
    calculatePopularityScore(sessions) {
        const now = Date.now();
        return sessions.reduce((score, session) => {
            const ageInDays = (now - new Date(session.started_at).getTime()) / (24 * 60 * 60 * 1000);
            const decay = Math.exp(-ageInDays / 7);
            return score + decay;
        }, 0);
    }
};
exports.PrismaRecommendationRepository = PrismaRecommendationRepository;
exports.PrismaRecommendationRepository = PrismaRecommendationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRecommendationRepository);
//# sourceMappingURL=prisma-recommendation.repository.js.map