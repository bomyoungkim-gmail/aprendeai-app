import { Module, Global } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../prisma/prisma.module";
import { MetricsService } from "./metrics.service";
import { ErrorTrackingService } from "./error-tracking.service";
import { ProviderUsageService } from "./provider-usage.service";
import { ObservabilityJobsService } from "./jobs.service";

@Global()
@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  providers: [
    MetricsService,
    ErrorTrackingService,
    ProviderUsageService,
    ObservabilityJobsService,
  ],
  exports: [MetricsService, ErrorTrackingService, ProviderUsageService],
})
export class ObservabilityModule {}
