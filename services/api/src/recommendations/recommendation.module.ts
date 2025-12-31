import { Module } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationController } from "./recommendation.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaRecommendationRepository } from "./infrastructure/repositories/prisma-recommendation.repository";
import { GetRecommendationsUseCase } from "./application/use-cases/get-recommendations.use-case";

import { SessionsModule } from "../sessions/sessions.module";
import { StudyGroupsModule } from "../study-groups/study-groups.module";

import { IRecommendationRepository } from "./domain/interfaces/recommendation.repository.interface";

@Module({
  imports: [PrismaModule, SessionsModule, StudyGroupsModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    GetRecommendationsUseCase,
    {
      provide: IRecommendationRepository,
      useClass: PrismaRecommendationRepository,
    },
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
