import { Module } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";
import { PrismaGamificationRepository } from "./infrastructure/repositories/prisma-gamification.repository";
import { IGamificationRepository } from "./domain/gamification.repository.interface";
import { RecordGameResultUseCase } from "./application/use-cases/record-game-result.use-case";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    RecordGameResultUseCase,
    {
      provide: IGamificationRepository,
      useClass: PrismaGamificationRepository,
    },
  ],
  exports: [GamificationService, RecordGameResultUseCase],
})
export class GamificationModule {}
