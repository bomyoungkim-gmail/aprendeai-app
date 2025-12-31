"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModule = void 0;
const common_1 = require("@nestjs/common");
const review_service_1 = require("./review.service");
const review_controller_1 = require("./review.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const profile_module_1 = require("../profiles/profile.module");
const srs_module_1 = require("../srs/srs.module");
const vocab_module_1 = require("../vocab/vocab.module");
const prisma_review_repository_1 = require("./infrastructure/repositories/prisma-review.repository");
const review_repository_interface_1 = require("./domain/review.repository.interface");
const get_review_queue_use_case_1 = require("./application/use-cases/get-review-queue.use-case");
const submit_review_use_case_1 = require("./application/use-cases/submit-review.use-case");
let ReviewModule = class ReviewModule {
};
exports.ReviewModule = ReviewModule;
exports.ReviewModule = ReviewModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, profile_module_1.ProfileModule, srs_module_1.SrsModule, vocab_module_1.VocabModule],
        controllers: [review_controller_1.ReviewController],
        providers: [
            review_service_1.ReviewService,
            get_review_queue_use_case_1.GetReviewQueueUseCase,
            submit_review_use_case_1.SubmitReviewUseCase,
            {
                provide: review_repository_interface_1.IReviewRepository,
                useClass: prisma_review_repository_1.PrismaReviewRepository,
            },
        ],
        exports: [review_service_1.ReviewService, get_review_queue_use_case_1.GetReviewQueueUseCase, submit_review_use_case_1.SubmitReviewUseCase, review_repository_interface_1.IReviewRepository],
    })
], ReviewModule);
//# sourceMappingURL=review.module.js.map