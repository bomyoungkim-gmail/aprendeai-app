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
exports.OverviewQueryDto = exports.UsageQueryDto = exports.ErrorQueryDto = exports.MetricsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class MetricsQueryDto {
}
exports.MetricsQueryDto = MetricsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Metric name", example: "api_request" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetricsQueryDto.prototype, "metric", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Start date (ISO string)",
        example: "2024-01-01T00:00:00Z",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MetricsQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "End date (ISO string)",
        example: "2024-01-02T00:00:00Z",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MetricsQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Time bucket",
        enum: ["1m", "1h", "1d"],
        example: "1h",
    }),
    (0, class_validator_1.IsEnum)(["1m", "1h", "1d"]),
    __metadata("design:type", String)
], MetricsQueryDto.prototype, "bucket", void 0);
class ErrorQueryDto {
}
exports.ErrorQueryDto = ErrorQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Start date" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ErrorQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "End date" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ErrorQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by resolved status" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ErrorQueryDto.prototype, "resolved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by endpoint" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ErrorQueryDto.prototype, "endpoint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Limit results" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ErrorQueryDto.prototype, "limit", void 0);
class UsageQueryDto {
}
exports.UsageQueryDto = UsageQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Provider name", example: "openai" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UsageQueryDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Start date" }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UsageQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "End date" }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UsageQueryDto.prototype, "to", void 0);
class OverviewQueryDto {
}
exports.OverviewQueryDto = OverviewQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Hours to look back", example: 24 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], OverviewQueryDto.prototype, "hours", void 0);
//# sourceMappingURL=dashboard.dto.js.map