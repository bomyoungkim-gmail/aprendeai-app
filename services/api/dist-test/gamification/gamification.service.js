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
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GamificationService = class GamificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [dailyActivity, dailyGoal, streak, badges] = await Promise.all([
            this.prisma.daily_activities.findUnique({
                where: { user_id_date: { user_id: userId, date: today } },
            }),
            this.prisma.daily_goals.findFirst({
                where: { user_id: userId },
                orderBy: { created_at: "desc" },
            }),
            this.prisma.streaks.findUnique({
                where: { user_id: userId },
            }),
            this.prisma.user_badges.findMany({
                where: { user_id: userId },
                include: { badges: true },
                orderBy: { awarded_at: "desc" },
                take: 3,
            }),
        ]);
        return {
            dailyActivity: dailyActivity || {
                minutes_spent: 0,
                lessons_completed: 0,
                goal_met: false,
            },
            dailyGoal: dailyGoal || { goal_type: "MINUTES", goal_value: 90 },
            streak: streak || { current_streak: 0, best_streak: 0, freeze_tokens: 0 },
            recentBadges: badges,
        };
    }
    async getGoalAchievements(userId) {
        const totalAchievements = await this.prisma.daily_activities.count({
            where: {
                user_id: userId,
                goal_met: true,
            },
        });
        return { totalAchievements };
    }
    async setDailyGoal(userId, dto) {
        return this.prisma.daily_goals.create({
            data: {
                id: crypto.randomUUID(),
                user_id: userId,
                goal_type: dto.goalType,
                goal_value: dto.goalValue,
                updated_at: new Date(),
            },
        });
    }
    async registerActivity(userId, dto) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let activity = await this.prisma.daily_activities.findUnique({
            where: { user_id_date: { user_id: userId, date: today } },
        });
        if (!activity) {
            activity = await this.prisma.daily_activities.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    date: today,
                },
            });
        }
        const updatedActivity = await this.prisma.daily_activities.update({
            where: { id: activity.id },
            data: {
                minutes_spent: { increment: dto.minutesSpentDelta || 0 },
                minutes_studied: { increment: dto.minutesSpentDelta || 0 },
                lessons_completed: { increment: dto.lessonsCompletedDelta || 0 },
                contents_read: { increment: dto.lessonsCompletedDelta || 0 },
            },
        });
        await this.checkGoalCompletion(userId, updatedActivity);
        this.updateSession(userId, dto).catch((e) => console.error("Failed to update session:", e));
        return updatedActivity;
    }
    async checkGoalCompletion(userId, activity) {
        if (activity.goal_met)
            return;
        const goal = (await this.prisma.daily_goals.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
        })) || { goal_type: client_1.DailyGoalType.MINUTES, goal_value: 90 };
        let met = false;
        if (goal.goal_type === client_1.DailyGoalType.MINUTES &&
            activity.minutes_spent >= goal.goal_value) {
            met = true;
        }
        else if (goal.goal_type === client_1.DailyGoalType.LESSONS &&
            activity.lessons_completed >= goal.goal_value) {
            met = true;
        }
        if (met) {
            await this.prisma.daily_activities.update({
                where: { id: activity.id },
                data: { goal_met: true },
            });
            await this.updateStreak(userId, activity.date);
        }
    }
    async updateStreak(userId, activityDate) {
        let streak = await this.prisma.streaks.findUnique({
            where: { user_id: userId },
        });
        if (!streak) {
            streak = await this.prisma.streaks.create({
                data: {
                    user_id: userId,
                    updated_at: new Date(),
                },
            });
        }
        const lastMet = streak.last_goal_met_date
            ? new Date(streak.last_goal_met_date)
            : null;
        const oneDay = 24 * 60 * 60 * 1000;
        if (!lastMet) {
            await this.prisma.streaks.update({
                where: { user_id: userId },
                data: {
                    current_streak: 1,
                    best_streak: 1,
                    last_goal_met_date: activityDate,
                },
            });
        }
        else {
            const diff = activityDate.getTime() - lastMet.getTime();
            const diffDays = Math.floor(diff / oneDay);
            if (diffDays === 0) {
            }
            else if (diffDays === 1) {
                const newCurrent = streak.current_streak + 1;
                await this.prisma.streaks.update({
                    where: { user_id: userId },
                    data: {
                        current_streak: newCurrent,
                        best_streak: Math.max(newCurrent, streak.best_streak),
                        last_goal_met_date: activityDate,
                    },
                });
            }
            else if (diffDays > 1) {
                const newCurrent = 1;
                await this.prisma.streaks.update({
                    where: { user_id: userId },
                    data: {
                        current_streak: newCurrent,
                        last_goal_met_date: activityDate,
                    },
                });
            }
        }
    }
    async updateSession(userId, dto) {
        const now = new Date();
        const threshold = new Date(now.getTime() - 5 * 60 * 1000);
        const recentSession = await this.prisma.study_sessions.findFirst({
            where: {
                user_id: userId,
                end_time: { gte: threshold },
            },
            orderBy: { end_time: "desc" },
        });
        const deltaMinutes = dto.minutesSpentDelta || 0;
        const newScore = dto.focusScore !== undefined ? dto.focusScore : 100;
        if (recentSession) {
            const currentDuration = recentSession.duration_minutes || 0;
            const totalDuration = currentDuration + deltaMinutes;
            let avgScore = 100;
            if (totalDuration > 0) {
                const currentScore = recentSession.focus_score || 100;
                avgScore =
                    (currentScore * currentDuration + newScore * deltaMinutes) /
                        totalDuration;
            }
            await this.prisma.study_sessions.update({
                where: { id: recentSession.id },
                data: {
                    end_time: now,
                    duration_minutes: { increment: deltaMinutes },
                    net_focus_minutes: { increment: deltaMinutes },
                    focus_score: avgScore,
                },
            });
        }
        else {
            await this.prisma.study_sessions.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    start_time: now,
                    end_time: now,
                    duration_minutes: deltaMinutes,
                    net_focus_minutes: deltaMinutes,
                    focus_score: newScore,
                    activity_type: dto.activityType || "reading",
                },
            });
        }
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map