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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const get_review_queue_use_case_1 = require("./application/use-cases/get-review-queue.use-case");
const submit_review_use_case_1 = require("./application/use-cases/submit-review.use-case");
let ReviewService = class ReviewService {
    constructor(getReviewQueueUseCase, submitReviewUseCase) {
        this.getReviewQueueUseCase = getReviewQueueUseCase;
        this.submitReviewUseCase = submitReviewUseCase;
    }
    async getReviewQueue(userId, limit) {
        return this.getReviewQueueUseCase.execute(userId, limit);
    }
    async recordVocabAttempt(userId, vocabId, dimension, result, sessionId) {
        return this.submitReviewUseCase.execute(userId, {
            vocabId,
            dimension,
            result,
            sessionId
        });
    }
    async getCueCards(userId) {
        return [];
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [get_review_queue_use_case_1.GetReviewQueueUseCase,
        submit_review_use_case_1.SubmitReviewUseCase])
], ReviewService);
//# sourceMappingURL=review.service.js.map