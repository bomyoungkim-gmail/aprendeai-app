import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GameProgressService } from "./game-progress.service";
import { GameLeaderboardService } from "./game-leaderboard.service";
import { QuestionAnalyticsService } from "./services/question-analytics.service";
import { QuestionSelectionService } from "./services/question-selection.service";
import { AIQuestionGeneratorService } from "./services/ai-question-generator.service";
import { PrismaModule } from "../prisma/prisma.module";
import { LLMModule } from "../llm/llm.module";

import { TopicMasteryModule } from "../analytics/topic-mastery.module";
import { GamificationModule } from "../gamification/gamification.module";

import { IGameProgressRepository } from "./domain/interfaces/game-progress.repository.interface";
import { PrismaGameProgressRepository } from "./infrastructure/repositories/prisma-game-progress.repository";
import { GetUserProgressUseCase } from "./application/use-cases/get-user-progress.use-case";
import { GetGameProgressUseCase } from "./application/use-cases/get-game-progress.use-case";
import { UpdateGameProgressUseCase } from "./application/use-cases/update-game-progress.use-case";

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    TopicMasteryModule,
    LLMModule,
    GamificationModule,
  ],
  controllers: [GamesController],
  providers: [
    GamesService,
    GameProgressService,
    GameLeaderboardService,
    QuestionAnalyticsService,
    QuestionSelectionService,
    AIQuestionGeneratorService,
    // Refactored Game Progress Providers
    {
      provide: IGameProgressRepository,
      useClass: PrismaGameProgressRepository,
    },
    GetUserProgressUseCase,
    GetGameProgressUseCase,
    UpdateGameProgressUseCase,
  ],
  exports: [
    GamesService,
    GameProgressService,
    GameLeaderboardService,
    GetUserProgressUseCase, // Export if needed by other modules
    GetGameProgressUseCase,
    UpdateGameProgressUseCase,
  ],
})
export class GamesModule {}
