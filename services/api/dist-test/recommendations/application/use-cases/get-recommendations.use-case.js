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
exports.GetRecommendationsUseCase = void 0;
const common_1 = require("@nestjs/common");
const recommendation_repository_interface_1 = require("../../domain/interfaces/recommendation.repository.interface");
const sessions_repository_interface_1 = require("../../../sessions/domain/sessions.repository.interface");
const study_groups_repository_interface_1 = require("../../../study-groups/domain/study-groups.repository.interface");
let GetRecommendationsUseCase = class GetRecommendationsUseCase {
    constructor(recommendationRepo, sessionsRepository, studyGroupsRepository) {
        this.recommendationRepo = recommendationRepo;
        this.sessionsRepository = sessionsRepository;
        this.studyGroupsRepository = studyGroupsRepository;
    }
    async execute(userId) {
        const activeGroups = await this.studyGroupsRepository.findByUser(userId);
        const groupIds = activeGroups.map((g) => g.id);
        const recentSessions = await this.sessionsRepository.findMany({
            where: { user_id: userId },
            orderBy: { started_at: 'desc' },
            take: 5,
        });
        const types = [...new Set(recentSessions.map((s) => { var _a; return (_a = s.content) === null || _a === void 0 ? void 0 : _a.type; }).filter(Boolean))];
        const languages = [...new Set(recentSessions.map((s) => { var _a; return (_a = s.content) === null || _a === void 0 ? void 0 : _a.originalLanguage; }).filter(Boolean))];
        const readIds = await this.sessionsRepository.findReadContentIds(userId);
        const [continueReading, recentReads, popularInGroups, similar, trending] = await Promise.all([
            this.recommendationRepo.getContinueReading(userId),
            this.recommendationRepo.getRecentReads(userId),
            this.recommendationRepo.getPopularInGroups(userId, groupIds),
            this.recommendationRepo.getSimilarContent(userId, types, languages, readIds),
            this.recommendationRepo.getTrending(userId, readIds),
        ]);
        return {
            continueReading,
            recentReads,
            popularInGroups,
            similar,
            trending,
        };
    }
};
exports.GetRecommendationsUseCase = GetRecommendationsUseCase;
exports.GetRecommendationsUseCase = GetRecommendationsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(recommendation_repository_interface_1.IRecommendationRepository)),
    __param(1, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __param(2, (0, common_1.Inject)(study_groups_repository_interface_1.IStudyGroupsRepository)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GetRecommendationsUseCase);
//# sourceMappingURL=get-recommendations.use-case.js.map