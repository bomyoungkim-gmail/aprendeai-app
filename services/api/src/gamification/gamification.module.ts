import { Module } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService], // Export so other modules can use it
})
export class GamificationModule {}
