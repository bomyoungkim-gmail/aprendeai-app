import { Module } from "@nestjs/common";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { PrismaModule } from "../prisma/prisma.module";
import { FamilyModule } from "../family/family.module";

// Infrastructure
import { PrismaOpsRepository } from "./infrastructure/repositories/prisma-ops.repository";

// Use Cases
import { GetDailySnapshotUseCase } from "./application/use-cases/get-daily-snapshot.use-case";
import { GetTaskQueueUseCase } from "./application/use-cases/get-task-queue.use-case";
import { GetContextCardsUseCase } from "./application/use-cases/get-context-cards.use-case";
import { LogStudyTimeUseCase } from "./application/use-cases/log-study-time.use-case";
import { IOpsRepository } from "./domain/interfaces/ops.repository.interface";

@Module({
  imports: [PrismaModule, FamilyModule],
  controllers: [OpsController],
  providers: [
    OpsService,
    { provide: IOpsRepository, useClass: PrismaOpsRepository },
    GetDailySnapshotUseCase,
    GetTaskQueueUseCase,
    GetContextCardsUseCase,
    LogStudyTimeUseCase,
  ],
  exports: [OpsService, IOpsRepository],
})
export class OpsModule {}
