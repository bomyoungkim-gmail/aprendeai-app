import { Module } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationController } from "./recommendation.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
