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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const review_service_1 = require("./review.service");
const review_dto_1 = require("./dto/review.dto");
let ReviewController = class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async getQueue(req, query) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "test-user-id";
        const limit = query.limit ? parseInt(query.limit, 10) : undefined;
        return this.reviewService.getReviewQueue(userId, limit);
    }
    async recordAttempt(req, dto) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "test-user-id";
        return this.reviewService.recordVocabAttempt(userId, dto.vocabId, dto.dimension, dto.result, dto.sessionId);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Get)("queue"),
    (0, swagger_1.ApiOperation)({ summary: "Get daily review queue" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Review queue retrieved successfully",
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.ReviewQueueQueryDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)("vocab/attempt"),
    (0, swagger_1.ApiOperation)({ summary: "Record vocabulary attempt" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Attempt recorded successfully" }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.VocabAttemptDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "recordAttempt", null);
exports.ReviewController = ReviewController = __decorate([
    (0, swagger_1.ApiTags)("Review"),
    (0, common_1.Controller)("v5/review"),
    (0, common_1.Controller)("review"),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map