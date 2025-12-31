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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const track_activity_use_case_1 = require("./application/use-cases/track-activity.use-case");
const get_activity_stats_use_case_1 = require("./application/use-cases/get-activity-stats.use-case");
const activity_repository_interface_1 = require("./domain/interfaces/activity.repository.interface");
let ActivityService = class ActivityService {
    constructor(trackActivityUseCase, getActivityStatsUseCase, activityRepo) {
        this.trackActivityUseCase = trackActivityUseCase;
        this.getActivityStatsUseCase = getActivityStatsUseCase;
        this.activityRepo = activityRepo;
    }
    async trackActivity(userId, type, minutes = 1) {
        return this.trackActivityUseCase.execute(userId, type, minutes);
    }
    async getActivityHeatmap(userId, days = 365) {
        const activities = await this.activityRepo.getActivityHeatmap(userId, days);
        return activities.map((activity) => ({
            date: activity.date.toISOString().split("T")[0],
            minutesStudied: activity.minutesStudied,
            sessionsCount: activity.sessionsCount,
            contentsRead: activity.contentsRead,
            annotationsCreated: activity.annotationsCreated,
        }));
    }
    async getActivityStats(userId) {
        return this.getActivityStatsUseCase.execute(userId);
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(activity_repository_interface_1.IActivityRepository)),
    __metadata("design:paramtypes", [track_activity_use_case_1.TrackActivityUseCase,
        get_activity_stats_use_case_1.GetActivityStatsUseCase, Object])
], ActivityService);
//# sourceMappingURL=activity.service.js.map