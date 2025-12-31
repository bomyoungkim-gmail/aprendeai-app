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
exports.GeneratedQuestionsResponseDto = exports.GenerateQuestionsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const question_bank_dto_1 = require("./question-bank.dto");
class GenerateQuestionsDto {
}
exports.GenerateQuestionsDto = GenerateQuestionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "CONCEPT_LINKING",
        description: "Type of game to generate questions for",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuestionsDto.prototype, "gameType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Fotossíntese",
        description: "Topic to generate questions about",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuestionsDto.prototype, "topic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Biologia", description: "Subject area" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuestionsDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: question_bank_dto_1.EducationLevel, example: question_bank_dto_1.EducationLevel.MEDIO }),
    (0, class_validator_1.IsEnum)(question_bank_dto_1.EducationLevel),
    __metadata("design:type", String)
], GenerateQuestionsDto.prototype, "educationLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        minimum: 1,
        description: "Number of questions to generate",
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerateQuestionsDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "pt-BR",
        description: "Target language (default: pt-BR)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuestionsDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 3,
        minimum: 1,
        maximum: 5,
        description: "Target difficulty (1-5)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerateQuestionsDto.prototype, "difficulty", void 0);
class GeneratedQuestionsResponseDto {
}
exports.GeneratedQuestionsResponseDto = GeneratedQuestionsResponseDto;
//# sourceMappingURL=generate-questions.dto.js.map