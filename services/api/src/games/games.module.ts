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

@Module({
  imports: [HttpModule, PrismaModule, TopicMasteryModule, LLMModule, GamificationModule],
  controllers: [GamesController],
  providers: [GamesService, GameProgressService, GameLeaderboardService, QuestionAnalyticsService, QuestionSelectionService, AIQuestionGeneratorService],
  exports: [GamesService, GameProgressService, GameLeaderboardService],
})
export class GamesModule {}
