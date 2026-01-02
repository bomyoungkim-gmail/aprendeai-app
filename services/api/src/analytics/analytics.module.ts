import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

import { TokenAnalyticsService } from "./token-analytics.service";
import { SessionTrackingModule } from "./session-tracking.module";
import { TopicMasteryModule } from "./topic-mastery.module";
import { GetStudentProgressUseCase } from "./application/use-cases/get-student-progress.use-case";
import { GetAggregatedMetricsUseCase } from "./application/use-cases/get-aggregated-metrics.use-case";
import { GetHourlyPerformanceUseCase } from "./application/use-cases/get-hourly-performance.use-case";
import { GetQualityOverviewUseCase } from "./application/use-cases/get-quality-overview.use-case";

@Module({
  imports: [SessionTrackingModule, TopicMasteryModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    GetStudentProgressUseCase,
    GetAggregatedMetricsUseCase,
    GetHourlyPerformanceUseCase,
    GetQualityOverviewUseCase,
    TokenAnalyticsService,
  ],
  exports: [AnalyticsService, TokenAnalyticsService],
})
export class AnalyticsModule {}
