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
exports.UpdatePrePhaseUseCase = void 0;
const common_1 = require("@nestjs/common");
const sessions_repository_interface_1 = require("../../domain/sessions.repository.interface");
const profile_service_1 = require("../../../profiles/profile.service");
let UpdatePrePhaseUseCase = class UpdatePrePhaseUseCase {
    constructor(sessionsRepository, profileService) {
        this.sessionsRepository = sessionsRepository;
        this.profileService = profileService;
    }
    async execute(sessionId, userId, data) {
        const session = await this.sessionsRepository.findById(sessionId);
        if (!session)
            throw new common_1.NotFoundException("Session not found");
        if (session.userId !== userId)
            throw new common_1.ForbiddenException("Access denied");
        if (session.phase !== "PRE") {
            throw new common_1.BadRequestException("Session not in PRE phase");
        }
        const profile = await this.profileService.get(userId);
        const minWords = this.getMinTargetWords(profile.educationLevel);
        if (data.targetWordsJson.length < minWords) {
            throw new common_1.BadRequestException(`Minimum ${minWords} target words required for ${profile.educationLevel} level`);
        }
        const updated = await this.sessionsRepository.update(sessionId, {
            goalStatement: data.goalStatement,
            predictionText: data.predictionText,
            targetWordsJson: data.targetWordsJson,
            phase: 'DURING',
        });
        return updated;
    }
    getMinTargetWords(level) {
        const MIN_WORDS = {
            FUNDAMENTAL_1: 3,
            FUNDAMENTAL_2: 4,
            MEDIO: 6,
            SUPERIOR: 8,
            ADULTO_LEIGO: 5,
        };
        return MIN_WORDS[level] || 5;
    }
};
exports.UpdatePrePhaseUseCase = UpdatePrePhaseUseCase;
exports.UpdatePrePhaseUseCase = UpdatePrePhaseUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __metadata("design:paramtypes", [Object, profile_service_1.ProfileService])
], UpdatePrePhaseUseCase);
//# sourceMappingURL=update-pre-phase.use-case.js.map