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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetActivityStatsUseCase = void 0;
const common_1 = require("@nestjs/common");
const activity_repository_interface_1 = require("../../domain/interfaces/activity.repository.interface");
const date_fns_1 = require("date-fns");
let GetActivityStatsUseCase = class GetActivityStatsUseCase {
    constructor(activityRepo) {
        this.activityRepo = activityRepo;
    }
    async execute(userId) {
        const oneYearAgo = (0, date_fns_1.subDays)(new Date(), 365);
        const sevenDaysAgo = (0, date_fns_1.subDays)(new Date(), 7);
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        const activities = await this.activityRepo.getActivities(userId, oneYearAgo);
        const totalDays = activities.length;
        const currentStreak = this.calculateCurrentStreak(activities);
        const longestStreak = this.calculateLongestStreak(activities);
        const totalMinutes = activities.reduce((sum, a) => sum + a.minutesStudied, 0);
        const avgMinutesPerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;
        const thisWeekMinutes = activities
            .filter((a) => a.date >= sevenDaysAgo)
            .reduce((sum, a) => sum + a.minutesStudied, 0);
        const thisMonthMinutes = activities
            .filter((a) => a.date >= thirtyDaysAgo)
            .reduce((sum, a) => sum + a.minutesStudied, 0);
        const activeTopics = await this.activityRepo.getActiveTopicsCount(userId, sevenDaysAgo);
        return {
            totalDays,
            activeTopics,
            currentStreak,
            longestStreak,
            avgMinutesPerDay,
            thisWeekMinutes,
            thisMonthMinutes,
        };
    }
    calculateCurrentStreak(activities) {
        if (activities.length === 0)
            return 0;
        const today = (0, date_fns_1.startOfDay)(new Date());
        let streak = 0;
        const hasToday = activities.some(a => (0, date_fns_1.differenceInDays)(today, a.date) === 0);
        const hasYesterday = activities.some(a => (0, date_fns_1.differenceInDays)(today, a.date) === 1);
        if (!hasToday && !hasYesterday)
            return 0;
        for (let i = 0; i < 365; i++) {
            const checkDate = (0, date_fns_1.subDays)(today, i);
            const hasActivity = activities.some(a => (0, date_fns_1.differenceInDays)(checkDate, a.date) === 0);
            if (hasActivity)
                streak++;
            else
                break;
        }
        return streak;
    }
    calculateLongestStreak(activities) {
        if (activities.length === 0)
            return 0;
        const sorted = [...activities].sort((a, b) => a.date.getTime() - b.date.getTime());
        let longestStreak = 1;
        let currentStreak = 1;
        for (let i = 1; i < sorted.length; i++) {
            const daysDiff = (0, date_fns_1.differenceInDays)(sorted[i].date, sorted[i - 1].date);
            if (daysDiff === 1) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            }
            else {
                currentStreak = 1;
            }
        }
        return longestStreak;
    }
};
exports.GetActivityStatsUseCase = GetActivityStatsUseCase;
exports.GetActivityStatsUseCase = GetActivityStatsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(activity_repository_interface_1.IActivityRepository)),
    __metadata("design:paramtypes", [Object])
], GetActivityStatsUseCase);
//# sourceMappingURL=get-activity-stats.use-case.js.map