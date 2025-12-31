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
exports.QuestionBankListDto = exports.QuestionBankResponseDto = exports.CreateQuestionBankDto = exports.SourceType = exports.EducationLevel = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["FUNDAMENTAL"] = "fundamental";
    EducationLevel["MEDIO"] = "medio";
    EducationLevel["SUPERIOR"] = "superior";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
var SourceType;
(function (SourceType) {
    SourceType["AI_GENERATED"] = "AI_GENERATED";
    SourceType["CURATED"] = "CURATED";
    SourceType["USER_CONTRIBUTED"] = "USER_CONTRIBUTED";
})(SourceType || (exports.SourceType = SourceType = {}));
class CreateQuestionBankDto {
}
exports.CreateQuestionBankDto = CreateQuestionBankDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "pt-BR", description: "Question language code" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "CONCEPT_LINKING",
        description: "Game type identifier",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "gameType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Biologia",
        description: "Subject name in the language",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Fotossíntese",
        description: "Topic name in the language",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "topic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 3,
        minimum: 1,
        maximum: 5,
        description: "Difficulty level 1-5",
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateQuestionBankDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: EducationLevel, example: EducationLevel.MEDIO }),
    (0, class_validator_1.IsEnum)(EducationLevel),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "educationLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Question content (format varies by game)" }),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], CreateQuestionBankDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Answer content with evaluation criteria" }),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], CreateQuestionBankDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata (tags, keywords)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", Object)
], CreateQuestionBankDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SourceType, example: SourceType.AI_GENERATED }),
    (0, class_validator_1.IsEnum)(SourceType),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "clxyz123",
        description: "Library content ID if based on user material",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "sourceContentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "photosynthesis",
        description: "Universal concept ID for linking translations",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionBankDto.prototype, "universalConceptId", void 0);
class QuestionBankResponseDto {
}
exports.QuestionBankResponseDto = QuestionBankResponseDto;
class QuestionBankListDto {
}
exports.QuestionBankListDto = QuestionBankListDto;
//# sourceMappingURL=question-bank.dto.js.map