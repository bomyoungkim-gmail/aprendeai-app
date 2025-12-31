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
exports.SubmitReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_repository_interface_1 = require("../../domain/review.repository.interface");
const vocab_repository_interface_1 = require("../../../vocab/domain/vocab.repository.interface");
const srs_service_1 = require("../../../srs/srs.service");
const vocab_attempt_entity_1 = require("../../domain/vocab-attempt.entity");
const uuid_1 = require("uuid");
let SubmitReviewUseCase = class SubmitReviewUseCase {
    constructor(reviewRepository, vocabRepository, srsService) {
        this.reviewRepository = reviewRepository;
        this.vocabRepository = vocabRepository;
        this.srsService = srsService;
    }
    async execute(userId, input) {
        const vocab = await this.vocabRepository.findById(input.vocabId);
        if (!vocab) {
            throw new common_1.NotFoundException(`Vocabulary item ${input.vocabId} not found`);
        }
        if (vocab.userId !== userId) {
            throw new common_1.NotFoundException(`Vocabulary item not found or access denied`);
        }
        const calc = this.srsService.calculateNextDue(vocab.srsStage, input.result);
        const masteryDelta = this.srsService.calculateMasteryDelta(input.result);
        const attempt = new vocab_attempt_entity_1.VocabAttempt({
            id: (0, uuid_1.v4)(),
            vocabId: vocab.id,
            sessionId: input.sessionId,
            dimension: input.dimension,
            result: input.result,
            createdAt: new Date(),
        });
        const updatedVocab = await this.reviewRepository.recordAttemptAndUpdateVocab(attempt, {
            id: vocab.id,
            srsStage: calc.newStage,
            dueAt: calc.dueDate,
            lapsesIncrement: calc.lapseIncrement,
            masteryDelta,
        });
        return updatedVocab;
    }
};
exports.SubmitReviewUseCase = SubmitReviewUseCase;
exports.SubmitReviewUseCase = SubmitReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(review_repository_interface_1.IReviewRepository)),
    __param(1, (0, common_1.Inject)(vocab_repository_interface_1.IVocabRepository)),
    __metadata("design:paramtypes", [Object, Object, srs_service_1.SrsService])
], SubmitReviewUseCase);
//# sourceMappingURL=submit-review.use-case.js.map