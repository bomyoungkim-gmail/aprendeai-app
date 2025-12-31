"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const games_controller_1 = require("./games.controller");
const games_service_1 = require("./games.service");
const game_progress_service_1 = require("./game-progress.service");
const game_leaderboard_service_1 = require("./game-leaderboard.service");
const question_analytics_service_1 = require("./services/question-analytics.service");
const question_selection_service_1 = require("./services/question-selection.service");
const ai_question_generator_service_1 = require("./services/ai-question-generator.service");
const prisma_module_1 = require("../prisma/prisma.module");
const llm_module_1 = require("../llm/llm.module");
const topic_mastery_module_1 = require("../analytics/topic-mastery.module");
const gamification_module_1 = require("../gamification/gamification.module");
const game_progress_repository_interface_1 = require("./domain/interfaces/game-progress.repository.interface");
const prisma_game_progress_repository_1 = require("./infrastructure/repositories/prisma-game-progress.repository");
const get_user_progress_use_case_1 = require("./application/use-cases/get-user-progress.use-case");
const get_game_progress_use_case_1 = require("./application/use-cases/get-game-progress.use-case");
const update_game_progress_use_case_1 = require("./application/use-cases/update-game-progress.use-case");
let GamesModule = class GamesModule {
};
exports.GamesModule = GamesModule;
exports.GamesModule = GamesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            prisma_module_1.PrismaModule,
            topic_mastery_module_1.TopicMasteryModule,
            llm_module_1.LLMModule,
            gamification_module_1.GamificationModule,
        ],
        controllers: [games_controller_1.GamesController],
        providers: [
            games_service_1.GamesService,
            game_progress_service_1.GameProgressService,
            game_leaderboard_service_1.GameLeaderboardService,
            question_analytics_service_1.QuestionAnalyticsService,
            question_selection_service_1.QuestionSelectionService,
            ai_question_generator_service_1.AIQuestionGeneratorService,
            {
                provide: game_progress_repository_interface_1.IGameProgressRepository,
                useClass: prisma_game_progress_repository_1.PrismaGameProgressRepository,
            },
            get_user_progress_use_case_1.GetUserProgressUseCase,
            get_game_progress_use_case_1.GetGameProgressUseCase,
            update_game_progress_use_case_1.UpdateGameProgressUseCase,
        ],
        exports: [
            games_service_1.GamesService,
            game_progress_service_1.GameProgressService,
            game_leaderboard_service_1.GameLeaderboardService,
            get_user_progress_use_case_1.GetUserProgressUseCase,
            get_game_progress_use_case_1.GetGameProgressUseCase,
            update_game_progress_use_case_1.UpdateGameProgressUseCase,
        ],
    })
], GamesModule);
//# sourceMappingURL=games.module.js.map