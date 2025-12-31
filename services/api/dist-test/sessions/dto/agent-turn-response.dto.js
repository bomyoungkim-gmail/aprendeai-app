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
exports.TokenUsageDto = exports.AgentTurnResponseDto = exports.HilRequestDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../common/enums");
class HilRequestDto {
}
exports.HilRequestDto = HilRequestDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], HilRequestDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.ActorRole),
    __metadata("design:type", String)
], HilRequestDto.prototype, "actorRole", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HilRequestDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], HilRequestDto.prototype, "options", void 0);
class AgentTurnResponseDto {
}
exports.AgentTurnResponseDto = AgentTurnResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgentTurnResponseDto.prototype, "threadId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgentTurnResponseDto.prototype, "readingSessionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgentTurnResponseDto.prototype, "nextPrompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AgentTurnResponseDto.prototype, "quickReplies", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => HilRequestDto),
    __metadata("design:type", HilRequestDto)
], AgentTurnResponseDto.prototype, "hilRequest", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AgentTurnResponseDto.prototype, "eventsToWrite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TokenUsageDto),
    __metadata("design:type", TokenUsageDto)
], AgentTurnResponseDto.prototype, "usage", void 0);
class TokenUsageDto {
}
exports.TokenUsageDto = TokenUsageDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TokenUsageDto.prototype, "prompt_tokens", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TokenUsageDto.prototype, "completion_tokens", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TokenUsageDto.prototype, "total_tokens", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TokenUsageDto.prototype, "cost_est_usd", void 0);
//# sourceMappingURL=agent-turn-response.dto.js.map