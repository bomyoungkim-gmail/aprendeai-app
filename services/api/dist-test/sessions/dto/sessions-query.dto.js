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
exports.SessionsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SessionsQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = "startedAt";
        this.sortOrder = "desc";
    }
}
exports.SessionsQueryDto = SessionsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, minimum: 1, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SessionsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, minimum: 1, maximum: 100, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SessionsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Filter sessions since this date (ISO 8601)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "since", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Filter sessions until this date (ISO 8601)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "until", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ["PRE", "DURING", "POST"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["PRE", "DURING", "POST"]),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "phase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Search in content title" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ["startedAt", "duration"],
        default: "startedAt",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["startedAt", "duration"]),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ["asc", "desc"], default: "desc" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["asc", "desc"]),
    __metadata("design:type", String)
], SessionsQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=sessions-query.dto.js.map