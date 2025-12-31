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
exports.ValidateProviderDto = exports.UpdateConfigDto = exports.CreateConfigDto = exports.ConfigFilterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class ConfigFilterDto {
}
exports.ConfigFilterDto = ConfigFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by category" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by environment",
        enum: client_1.Environment,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Environment),
    __metadata("design:type", String)
], ConfigFilterDto.prototype, "environment", void 0);
class CreateConfigDto {
}
exports.CreateConfigDto = CreateConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Config key (unique)",
        example: "openai.api_key",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Config value" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Value type", enum: client_1.ConfigType }),
    (0, class_validator_1.IsEnum)(client_1.ConfigType),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Config category", example: "provider" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Environment (null = all)",
        enum: client_1.Environment,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Environment),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Human-readable description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata (JSON)" }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateConfigDto.prototype, "metadata", void 0);
class UpdateConfigDto {
}
exports.UpdateConfigDto = UpdateConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "New value" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateConfigDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Updated description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateConfigDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Updated metadata" }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateConfigDto.prototype, "metadata", void 0);
class ValidateProviderDto {
}
exports.ValidateProviderDto = ValidateProviderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Provider configuration (varies by provider)" }),
    __metadata("design:type", Object)
], ValidateProviderDto.prototype, "config", void 0);
//# sourceMappingURL=config.dto.js.map