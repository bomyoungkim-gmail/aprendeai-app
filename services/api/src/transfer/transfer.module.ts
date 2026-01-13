import { Module } from "@nestjs/common";
import { TransferMetadataService } from "./transfer-metadata.service";
import { TransferMetadataController } from "./transfer-metadata.controller";
import { TransferMissionsController } from "./transfer-missions.controller";
import { TransferMissionsService } from "./transfer-missions.service";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { TelemetryModule } from "../telemetry/telemetry.module";
import { DecisionModule } from "../decision/decision.module";
import { PrismaTransferMetadataRepository } from "./infrastructure/repositories/prisma-transfer-metadata.repository";
import { PrismaTransferMissionRepository } from "./infrastructure/repositories/prisma-transfer-mission.repository";
import { ITransferMetadataRepository } from "./domain/transfer-metadata.repository.interface";
import { ITransferMissionRepository } from "./domain/transfer-mission.repository.interface";
import { ExtractMetadataUseCase } from "./application/use-cases/extract-metadata.use-case";
import { ProductiveFailureService } from "./application/productive-failure.service";
import { TransferMetadataConsumer } from "../workers/transfer-metadata.consumer";

@Module({
  imports: [PrismaModule, QueueModule, TelemetryModule, DecisionModule],
  controllers: [TransferMetadataController, TransferMissionsController],
  providers: [
    TransferMetadataService,
    TransferMissionsService,
    ExtractMetadataUseCase,
    ProductiveFailureService,
    TransferMetadataConsumer,
    {
      provide: ITransferMetadataRepository,
      useClass: PrismaTransferMetadataRepository,
    },
    {
      provide: ITransferMissionRepository,
      useClass: PrismaTransferMissionRepository,
    },
  ],
  exports: [
    TransferMetadataService,
    TransferMissionsService,
    ExtractMetadataUseCase,
    ProductiveFailureService,
    TransferMetadataConsumer,
    ITransferMetadataRepository,
    ITransferMissionRepository,
  ],
})
export class TransferModule {}
