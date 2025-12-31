"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const token_analytics_service_1 = require("./token-analytics.service");
const session_tracking_module_1 = require("./session-tracking.module");
const topic_mastery_module_1 = require("./topic-mastery.module");
const get_student_progress_use_case_1 = require("./application/use-cases/get-student-progress.use-case");
const get_aggregated_metrics_use_case_1 = require("./application/use-cases/get-aggregated-metrics.use-case");
const get_hourly_performance_use_case_1 = require("./application/use-cases/get-hourly-performance.use-case");
const get_quality_overview_use_case_1 = require("./application/use-cases/get-quality-overview.use-case");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [session_tracking_module_1.SessionTrackingModule, topic_mastery_module_1.TopicMasteryModule],
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [
            analytics_service_1.AnalyticsService,
            get_student_progress_use_case_1.GetStudentProgressUseCase,
            get_aggregated_metrics_use_case_1.GetAggregatedMetricsUseCase,
            get_hourly_performance_use_case_1.GetHourlyPerformanceUseCase,
            get_quality_overview_use_case_1.GetQualityOverviewUseCase,
            token_analytics_service_1.TokenAnalyticsService,
        ],
        exports: [analytics_service_1.AnalyticsService, token_analytics_service_1.TokenAnalyticsService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map