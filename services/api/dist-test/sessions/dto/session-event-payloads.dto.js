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
exports.ProductionSubmitPayloadDto = exports.QuizResponsePayloadDto = exports.CheckpointResponsePayloadDto = exports.MarkKeyIdeaPayloadDto = exports.MarkUnknownWordPayloadDto = void 0;
const class_validator_1 = require("class-validator");
class MarkUnknownWordPayloadDto {
}
exports.MarkUnknownWordPayloadDto = MarkUnknownWordPayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "word", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["PT", "EN", "KO"]),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["SKIM", "READ"]),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "blockId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "chunkId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MarkUnknownWordPayloadDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MarkUnknownWordPayloadDto.prototype, "span", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkUnknownWordPayloadDto.prototype, "note", void 0);
class MarkKeyIdeaPayloadDto {
}
exports.MarkKeyIdeaPayloadDto = MarkKeyIdeaPayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkKeyIdeaPayloadDto.prototype, "blockId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkKeyIdeaPayloadDto.prototype, "excerpt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkKeyIdeaPayloadDto.prototype, "note", void 0);
class CheckpointResponsePayloadDto {
}
exports.CheckpointResponsePayloadDto = CheckpointResponsePayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckpointResponsePayloadDto.prototype, "blockId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckpointResponsePayloadDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckpointResponsePayloadDto.prototype, "questionText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckpointResponsePayloadDto.prototype, "answerText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CheckpointResponsePayloadDto.prototype, "confidence", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CheckpointResponsePayloadDto.prototype, "rubric", void 0);
class QuizResponsePayloadDto {
}
exports.QuizResponsePayloadDto = QuizResponsePayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizResponsePayloadDto.prototype, "quizId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizResponsePayloadDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizResponsePayloadDto.prototype, "answerText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], QuizResponsePayloadDto.prototype, "confidence", void 0);
class ProductionSubmitPayloadDto {
}
exports.ProductionSubmitPayloadDto = ProductionSubmitPayloadDto;
__decorate([
    (0, class_validator_1.IsEnum)(["FREE_RECALL", "SENTENCES", "ORAL", "OPEN_DIALOGUE"]),
    __metadata("design:type", String)
], ProductionSubmitPayloadDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductionSubmitPayloadDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProductionSubmitPayloadDto.prototype, "usedWords", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], ProductionSubmitPayloadDto.prototype, "confidence", void 0);
//# sourceMappingURL=session-event-payloads.dto.js.map