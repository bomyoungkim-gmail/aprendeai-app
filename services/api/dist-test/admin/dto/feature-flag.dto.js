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
exports.FeatureFlagFilterDto = exports.DeleteFeatureFlagDto = exports.ToggleFeatureFlagDto = exports.UpdateFeatureFlagDto = exports.CreateFeatureFlagDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFeatureFlagDto {
}
exports.CreateFeatureFlagDto = CreateFeatureFlagDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Unique flag key (lowercase_underscore format)",
        example: "enable_ai_translation",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-z_]+$/, {
        message: "Key must be lowercase with underscores only",
    }),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Display name", example: "AI Translation" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Feature description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Initial enabled state", default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeatureFlagDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Target environment",
        enum: ["DEV", "STAGING", "PROD"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["DEV", "STAGING", "PROD"]),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Scope type",
        enum: ["GLOBAL", "INSTITUTION", "USER"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["GLOBAL", "INSTITUTION", "USER"]),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "scopeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Scope target ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "scopeId", void 0);
class UpdateFeatureFlagDto {
}
exports.UpdateFeatureFlagDto = UpdateFeatureFlagDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFeatureFlagDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFeatureFlagDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFeatureFlagDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["DEV", "STAGING", "PROD"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["DEV", "STAGING", "PROD"]),
    __metadata("design:type", String)
], UpdateFeatureFlagDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["GLOBAL", "INSTITUTION", "USER"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["GLOBAL", "INSTITUTION", "USER"]),
    __metadata("design:type", String)
], UpdateFeatureFlagDto.prototype, "scopeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFeatureFlagDto.prototype, "scopeId", void 0);
class ToggleFeatureFlagDto {
}
exports.ToggleFeatureFlagDto = ToggleFeatureFlagDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "New enabled state" }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleFeatureFlagDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reason for toggle (for audit)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ToggleFeatureFlagDto.prototype, "reason", void 0);
class DeleteFeatureFlagDto {
}
exports.DeleteFeatureFlagDto = DeleteFeatureFlagDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for deletion (required for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteFeatureFlagDto.prototype, "reason", void 0);
class FeatureFlagFilterDto {
}
exports.FeatureFlagFilterDto = FeatureFlagFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by environment",
        enum: ["DEV", "STAGING", "PROD"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["DEV", "STAGING", "PROD"]),
    __metadata("design:type", String)
], FeatureFlagFilterDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by enabled status" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FeatureFlagFilterDto.prototype, "enabled", void 0);
//# sourceMappingURL=feature-flag.dto.js.map