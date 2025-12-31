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
exports.SecretFilterDto = exports.DeleteSecretDto = exports.UpdateSecretDto = exports.CreateSecretDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSecretDto {
}
exports.CreateSecretDto = CreateSecretDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Unique secret key", example: "openai_api_key" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Display name", example: "OpenAI API Key" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Secret value (will be encrypted)",
        example: "sk-...",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Provider identifier",
        example: "openai",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Target environment",
        enum: ["DEV", "STAGING", "PROD"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["DEV", "STAGING", "PROD"]),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "environment", void 0);
class UpdateSecretDto {
}
exports.UpdateSecretDto = UpdateSecretDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "New secret value" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecretDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for rotation/update (for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecretDto.prototype, "reason", void 0);
class DeleteSecretDto {
}
exports.DeleteSecretDto = DeleteSecretDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for deletion (required for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteSecretDto.prototype, "reason", void 0);
class SecretFilterDto {
}
exports.SecretFilterDto = SecretFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by provider" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SecretFilterDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by environment",
        enum: ["DEV", "STAGING", "PROD"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["DEV", "STAGING", "PROD"]),
    __metadata("design:type", String)
], SecretFilterDto.prototype, "environment", void 0);
//# sourceMappingURL=secret.dto.js.map