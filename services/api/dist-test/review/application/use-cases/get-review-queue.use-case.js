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
exports.GetReviewQueueUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/review.repository.interface");
const profile_service_1 = require("../../../profiles/profile.service");
let GetReviewQueueUseCase = class GetReviewQueueUseCase {
    constructor(reviewRepository, profileService) {
        this.reviewRepository = reviewRepository;
        this.profileService = profileService;
    }
    async execute(userId, limit) {
        let cap = limit;
        if (!cap) {
            const profile = await this.profileService.get(userId);
            cap = (profile === null || profile === void 0 ? void 0 : profile.dailyReviewCap) || 20;
        }
        const vocab = await this.reviewRepository.findDue(userId, cap);
        const totalDue = await this.reviewRepository.countDue(userId);
        return {
            vocab,
            cues: [],
            stats: {
                totalDue,
                cap,
                vocabCount: vocab.length,
                cuesCount: 0,
            },
        };
    }
};
exports.GetReviewQueueUseCase = GetReviewQueueUseCase;
exports.GetReviewQueueUseCase = GetReviewQueueUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __metadata("design:paramtypes", [Object, profile_service_1.ProfileService])
], GetReviewQueueUseCase);
//# sourceMappingURL=get-review-queue.use-case.js.map