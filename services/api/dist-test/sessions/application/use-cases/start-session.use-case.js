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
exports.StartSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const sessions_repository_interface_1 = require("../../domain/sessions.repository.interface");
const profile_service_1 = require("../../../profiles/profile.service");
const gating_service_1 = require("../../../gating/gating.service");
const content_repository_interface_1 = require("../../../cornell/domain/content.repository.interface");
let StartSessionUseCase = class StartSessionUseCase {
    constructor(sessionsRepository, profileService, gatingService, contentRepository) {
        this.sessionsRepository = sessionsRepository;
        this.profileService = profileService;
        this.gatingService = gatingService;
        this.contentRepository = contentRepository;
    }
    async execute(userId, contentId) {
        const profile = await this.profileService.getOrCreate(userId);
        const content = await this.contentRepository.findById(contentId);
        if (!content) {
            throw new common_1.NotFoundException("Content not found");
        }
        const assetLayer = await this.gatingService.determineLayer(userId, contentId);
        const session = await this.sessionsRepository.create({
            id: (0, uuid_1.v4)(),
            userId: userId,
            contentId: contentId,
            phase: "PRE",
            modality: "READING",
            assetLayer: assetLayer,
            startTime: new Date()
        });
        const minTargetWords = this.getMinTargetWords(profile.educationLevel);
        return Object.assign(Object.assign({}, session), { minTargetWords });
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
exports.StartSessionUseCase = StartSessionUseCase;
exports.StartSessionUseCase = StartSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __param(3, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __metadata("design:paramtypes", [Object, profile_service_1.ProfileService,
        gating_service_1.GatingService, Object])
], StartSessionUseCase);
//# sourceMappingURL=start-session.use-case.js.map