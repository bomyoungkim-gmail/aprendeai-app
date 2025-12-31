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
exports.GetQualityOverviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_interface_1 = require("../../domain/analytics.repository.interface");
let GetQualityOverviewUseCase = class GetQualityOverviewUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, period) {
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const sessions = await this.repository.getQualitySessions(userId, since);
        if (sessions.length === 0) {
            return { period: days, totalSessions: 0, avgAccuracy: 0 };
        }
        const totals = sessions.reduce((acc, s) => ({
            accuracy: acc.accuracy + (s.accuracy_rate || 0),
            focus: acc.focus + (s.focus_score || 0),
        }), { accuracy: 0, focus: 0 });
        return {
            period: days,
            totalSessions: sessions.length,
            avgAccuracy: Math.round((totals.accuracy / sessions.length) * 10) / 10,
            avgFocusScore: Math.round((totals.focus / sessions.length) * 10) / 10,
        };
    }
};
exports.GetQualityOverviewUseCase = GetQualityOverviewUseCase;
exports.GetQualityOverviewUseCase = GetQualityOverviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(analytics_repository_interface_1.IAnalyticsRepository)),
    __metadata("design:paramtypes", [Object])
], GetQualityOverviewUseCase);
//# sourceMappingURL=get-quality-overview.use-case.js.map