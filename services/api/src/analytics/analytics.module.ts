import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { HourlyActivityCacheService } from "./application/services/hourly-activity-cache.service";

import { TokenAnalyticsService } from "./token-analytics.service";
import { SessionTrackingModule } from "./session-tracking.module";
import { TopicMasteryModule } from "./topic-mastery.module";
import { GetStudentProgressUseCase } from "./application/use-cases/get-student-progress.use-case";
import { GetAggregatedMetricsUseCase } from "./application/use-cases/get-aggregated-metrics.use-case";
import { GetHourlyPerformanceUseCase } from "./application/use-cases/get-hourly-performance.use-case";
import { GetQualityOverviewUseCase } from "./application/use-cases/get-quality-overview.use-case";
import { ProgressVisibilityService } from "../common/services/progress-visibility.service";
import { ContentModeAnalyticsController } from "./content-mode-analytics.controller";
import { ContentModeAnalyticsService } from "./content-mode-analytics.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SessionTrackingModule,
    TopicMasteryModule,
  ],
  controllers: [AnalyticsController, ContentModeAnalyticsController],
  providers: [
    AnalyticsService,
    GetStudentProgressUseCase,
    GetAggregatedMetricsUseCase,
    GetHourlyPerformanceUseCase,
    GetQualityOverviewUseCase,
    TokenAnalyticsService,
    HourlyActivityCacheService,
    ProgressVisibilityService,
    ContentModeAnalyticsService,
  ],
  exports: [
    AnalyticsService,
    TokenAnalyticsService,
    ContentModeAnalyticsService,
  ],
})
export class AnalyticsModule {}
