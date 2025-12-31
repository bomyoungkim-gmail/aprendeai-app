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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_interface_1 = require("./domain/analytics.repository.interface");
const get_student_progress_use_case_1 = require("./application/use-cases/get-student-progress.use-case");
const get_hourly_performance_use_case_1 = require("./application/use-cases/get-hourly-performance.use-case");
const get_quality_overview_use_case_1 = require("./application/use-cases/get-quality-overview.use-case");
let AnalyticsService = class AnalyticsService {
    constructor(repository, getProgressUseCase, getHourlyPerformanceUseCase, getQualityOverviewUseCase) {
        this.repository = repository;
        this.getProgressUseCase = getProgressUseCase;
        this.getHourlyPerformanceUseCase = getHourlyPerformanceUseCase;
        this.getQualityOverviewUseCase = getQualityOverviewUseCase;
    }
    async getStudentProgress(userId) {
        return this.getProgressUseCase.execute(userId);
    }
    async getVocabularyList(userId) {
        return this.repository.getVocabularyList(userId, 50);
    }
    async getHourlyPerformance(userId, days) {
        return this.getHourlyPerformanceUseCase.execute(userId, days);
    }
    async getQualityOverview(userId, period) {
        return this.getQualityOverviewUseCase.execute(userId, period);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(analytics_repository_interface_1.IAnalyticsRepository)),
    __metadata("design:paramtypes", [Object, get_student_progress_use_case_1.GetStudentProgressUseCase,
        get_hourly_performance_use_case_1.GetHourlyPerformanceUseCase,
        get_quality_overview_use_case_1.GetQualityOverviewUseCase])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map