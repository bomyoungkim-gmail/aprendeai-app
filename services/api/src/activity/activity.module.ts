import { Module } from "@nestjs/common";
import { ActivityService } from "./activity.service";
import { ActivityController } from "./activity.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaActivityRepository } from "./infrastructure/repositories/prisma-activity.repository";
import { TrackActivityUseCase } from "./application/use-cases/track-activity.use-case";
import { GetActivityStatsUseCase } from "./application/use-cases/get-activity-stats.use-case";
import { IActivityRepository } from "./domain/interfaces/activity.repository.interface";

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController],
  providers: [
    ActivityService,
    TrackActivityUseCase,
    GetActivityStatsUseCase,
    { provide: IActivityRepository, useClass: PrismaActivityRepository },
  ],
  exports: [ActivityService, IActivityRepository],
})
export class ActivityModule {}
