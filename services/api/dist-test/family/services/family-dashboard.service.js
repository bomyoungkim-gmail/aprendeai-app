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
exports.FamilyDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const family_privacy_guard_service_1 = require("../../privacy/family-privacy-guard.service");
const types_1 = require("../../privacy/types");
let FamilyDashboardService = class FamilyDashboardService {
    constructor(prisma, privacyGuard) {
        this.prisma = prisma;
        this.privacyGuard = privacyGuard;
    }
    async getEducatorDashboard(family_id, learner_user_id) {
        const policy = await this.prisma.family_policies.findUnique({
            where: {
                family_id_learner_user_id: {
                    family_id,
                    learner_user_id,
                },
            },
        });
        const privacy_mode = (policy === null || policy === void 0 ? void 0 : policy.privacy_mode) || types_1.PrivacyMode.AGGREGATED_ONLY;
        const rawData = await this.calculateStats(learner_user_id);
        return this.privacyGuard.filterDashboardData(rawData, privacy_mode);
    }
    async calculateStats(learner_user_id) {
        const sessions = await this.prisma.reading_sessions.findMany({
            where: { user_id: learner_user_id },
            orderBy: { started_at: "desc" },
            take: 30,
        });
        const streakDays = this.calculateStreak(sessions);
        const minutesTotal = sessions.reduce((sum, s) => {
            const duration = s.finished_at
                ? Math.round((s.finished_at.getTime() - s.started_at.getTime()) / 60000)
                : 0;
            return sum + duration;
        }, 0);
        const comprehensionAvg = 75;
        const comprehensionTrend = this.calculateTrend(sessions);
        const topBlockers = await this.getTopBlockers(learner_user_id);
        const alerts = await this.getAlerts(learner_user_id);
        return {
            streakDays,
            minutesTotal,
            comprehensionAvg,
            comprehensionTrend,
            topBlockers,
            alerts,
        };
    }
    calculateStreak(sessions) {
        if (sessions.length === 0)
            return 0;
        const dates = sessions.map((s) => {
            const d = new Date(s.started_at);
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        });
        const uniqueDates = [...new Set(dates)].sort().reverse();
        let streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
            if (diffDays === 1) {
                streak++;
            }
            else {
                break;
            }
        }
        return streak;
    }
    calculateTrend(sessions) {
        return "FLAT";
    }
    async getTopBlockers(learner_user_id) {
        return ["vocabulary", "complex sentences"];
    }
    async getAlerts(learner_user_id) {
        return [];
    }
    async getWeeklySummary(family_id, learner_user_id) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const sessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: learner_user_id,
                started_at: { gte: weekStart },
            },
        });
        return {
            weekStart: weekStart.toISOString(),
            sessionCount: sessions.length,
            minutesTotal: sessions.reduce((sum, s) => {
                const duration = s.finished_at
                    ? Math.round((s.finished_at.getTime() - s.started_at.getTime()) / 60000)
                    : 0;
                return sum + duration;
            }, 0),
            comprehensionAvg: 75,
            topBlockers: await this.getTopBlockers(learner_user_id),
            actions: [
                "Continuar prática diária",
                "Focar em vocabulário",
                "Tentar textos mais curtos",
            ],
        };
    }
};
exports.FamilyDashboardService = FamilyDashboardService;
exports.FamilyDashboardService = FamilyDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        family_privacy_guard_service_1.FamilyPrivacyGuard])
], FamilyDashboardService);
//# sourceMappingURL=family-dashboard.service.js.map