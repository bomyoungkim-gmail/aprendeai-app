import { Module } from "@nestjs/common";
import { SessionTrackingService } from "./session-tracking.service";
import { PrismaModule } from "../prisma/prisma.module";
import { IAnalyticsRepository } from "./domain/analytics.repository.interface";
import { PrismaAnalyticsRepository } from "./infrastructure/repositories/prisma-analytics.repository";
import { TrackStudySessionUseCase } from "./application/use-cases/track-study-session.use-case";

@Module({
  imports: [PrismaModule],
  providers: [
    SessionTrackingService,
    TrackStudySessionUseCase,
    {
      provide: IAnalyticsRepository,
      useClass: PrismaAnalyticsRepository,
    },
  ],
  exports: [
    SessionTrackingService,
    TrackStudySessionUseCase,
    IAnalyticsRepository,
  ],
})
export class SessionTrackingModule {}
