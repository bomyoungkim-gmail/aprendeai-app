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
exports.GetHourlyPerformanceUseCase = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_interface_1 = require("../../domain/analytics.repository.interface");
let GetHourlyPerformanceUseCase = class GetHourlyPerformanceUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const hourlyData = await this.repository.getHourlyPerformance(userId, since);
        const transformed = hourlyData.map((row) => ({
            hour: row.hour,
            avgAccuracy: row.avg_accuracy || 0,
            avgFocusScore: row.avg_focus_score || 0,
            sessionCount: Number(row.total_sessions),
            totalMinutes: Number(row.total_minutes),
        }));
        const ranked = [...transformed].sort((a, b) => b.avgFocusScore - a.avgFocusScore);
        const peakHours = ranked.slice(0, 3).map((r) => r.hour);
        return {
            hourlyBreakdown: transformed,
            peakHours,
            daysAnalyzed: days,
        };
    }
};
exports.GetHourlyPerformanceUseCase = GetHourlyPerformanceUseCase;
exports.GetHourlyPerformanceUseCase = GetHourlyPerformanceUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(analytics_repository_interface_1.IAnalyticsRepository)),
    __metadata("design:paramtypes", [Object])
], GetHourlyPerformanceUseCase);
//# sourceMappingURL=get-hourly-performance.use-case.js.map