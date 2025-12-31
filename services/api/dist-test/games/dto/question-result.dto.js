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
exports.QuestionResultWithAnalyticsDto = exports.QuestionResultResponseDto = exports.SubmitQuestionResultDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SubmitQuestionResultDto {
}
exports.SubmitQuestionResultDto = SubmitQuestionResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "clxyz789",
        description: "Question ID that was answered",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitQuestionResultDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 85,
        minimum: 0,
        maximum: 100,
        description: "Score achieved (0-100)",
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SubmitQuestionResultDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 45,
        minimum: 0,
        description: "Time taken in seconds",
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SubmitQuestionResultDto.prototype, "timeTaken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: "Whether the answer was correct" }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitQuestionResultDto.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2,
        minimum: 1,
        maximum: 3,
        description: "Self-assessment rating for SRS (1=Difícil, 2=Bom, 3=Fácil)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], SubmitQuestionResultDto.prototype, "selfRating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "User's submitted answer" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], SubmitQuestionResultDto.prototype, "userAnswer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Mistakes made (e.g., forbidden words used)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], SubmitQuestionResultDto.prototype, "mistakes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "session_123",
        description: "Game session ID for grouping",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitQuestionResultDto.prototype, "gameSessionId", void 0);
class QuestionResultResponseDto {
}
exports.QuestionResultResponseDto = QuestionResultResponseDto;
class QuestionResultWithAnalyticsDto extends QuestionResultResponseDto {
}
exports.QuestionResultWithAnalyticsDto = QuestionResultWithAnalyticsDto;
//# sourceMappingURL=question-result.dto.js.map