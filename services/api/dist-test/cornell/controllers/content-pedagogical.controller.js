"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPedagogicalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/jwt-auth.guard");
const content_pedagogical_service_1 = require("../services/content-pedagogical.service");
const create_content_pedagogical_data_dto_1 = require("../dto/create-content-pedagogical-data.dto");
const create_game_result_dto_1 = require("../dto/create-game-result.dto");
let ContentPedagogicalController = class ContentPedagogicalController {
    constructor(pedagogicalService) {
        this.pedagogicalService = pedagogicalService;
    }
    async getContext(contentId) {
        const pedagogicalData = await this.pedagogicalService.getPedagogicalData(contentId);
        return {
            pedagogicalData,
        };
    }
    async createOrUpdatePedagogical(contentId, dto) {
        const pedagogicalData = {
            vocabulary_triage: dto.vocabularyTriage,
            socratic_questions: dto.socraticQuestions,
            quiz_questions: dto.quizQuestions,
            taboo_cards: dto.tabooCards,
            boss_fight_config: dto.bossFightConfig,
            free_recall_prompts: dto.freeRecallPrompts,
            processing_version: dto.processingVersion,
        };
        return this.pedagogicalService.createOrUpdatePedagogicalData(contentId, pedagogicalData);
    }
    async recordGameResult(contentId, dto) {
        throw new Error("UserId extraction not implemented yet");
    }
};
exports.ContentPedagogicalController = ContentPedagogicalController;
__decorate([
    (0, common_1.Get)("contents/:id/context"),
    (0, swagger_1.ApiOperation)({
        summary: "Get pedagogical context (metadata + game results)",
    }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentPedagogicalController.prototype, "getContext", null);
__decorate([
    (0, common_1.Post)("contents/:id/pedagogical"),
    (0, swagger_1.ApiOperation)({
        summary: "Create or update pedagogical data (Internal/Worker use)",
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_content_pedagogical_data_dto_1.CreateContentPedagogicalDataDto]),
    __metadata("design:returntype", Promise)
], ContentPedagogicalController.prototype, "createOrUpdatePedagogical", null);
__decorate([
    (0, common_1.Post)("contents/:id/game-results"),
    (0, swagger_1.ApiOperation)({ summary: "Record a game result" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_game_result_dto_1.CreateGameResultDto]),
    __metadata("design:returntype", Promise)
], ContentPedagogicalController.prototype, "recordGameResult", null);
exports.ContentPedagogicalController = ContentPedagogicalController = __decorate([
    (0, swagger_1.ApiTags)("Cornell Pedagogical"),
    (0, common_1.Controller)("cornell"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [content_pedagogical_service_1.ContentPedagogicalService])
], ContentPedagogicalController);
//# sourceMappingURL=content-pedagogical.controller.js.map