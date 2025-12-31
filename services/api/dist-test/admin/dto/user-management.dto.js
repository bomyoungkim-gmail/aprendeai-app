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
exports.ImpersonateUserDto = exports.UpdateUserRolesDto = exports.RoleAssignmentDto = exports.UpdateUserStatusDto = exports.UserSearchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class UserSearchDto {
    constructor() {
        this.page = 1;
        this.limit = 25;
    }
}
exports.UserSearchDto = UserSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Search by email or name" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by status",
        enum: ["ACTIVE", "SUSPENDED", "DELETED"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["ACTIVE", "SUSPENDED", "DELETED"]),
    __metadata("design:type", String)
], UserSearchDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by system role",
        enum: client_1.SystemRole,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SystemRole),
    __metadata("design:type", String)
], UserSearchDto.prototype, "systemRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filter by context role",
        enum: client_1.ContextRole,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ContextRole),
    __metadata("design:type", String)
], UserSearchDto.prototype, "contextRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by institution ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserSearchDto.prototype, "institutionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Page number", default: 1, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UserSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Results per page",
        default: 25,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UserSearchDto.prototype, "limit", void 0);
class UpdateUserStatusDto {
}
exports.UpdateUserStatusDto = UpdateUserStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "New status",
        enum: ["ACTIVE", "SUSPENDED", "DELETED"],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(["ACTIVE", "SUSPENDED", "DELETED"]),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for status change (required for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "reason", void 0);
class RoleAssignmentDto {
}
exports.RoleAssignmentDto = RoleAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: Object.assign(Object.assign({}, client_1.SystemRole), client_1.ContextRole) }),
    (0, class_validator_1.IsEnum)(Object.assign(Object.assign({}, client_1.SystemRole), client_1.ContextRole)),
    __metadata("design:type", String)
], RoleAssignmentDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["GLOBAL", "INSTITUTION", "USER"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["GLOBAL", "INSTITUTION", "USER"]),
    __metadata("design:type", String)
], RoleAssignmentDto.prototype, "scopeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoleAssignmentDto.prototype, "scopeId", void 0);
class UpdateUserRolesDto {
}
exports.UpdateUserRolesDto = UpdateUserRolesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [RoleAssignmentDto],
        description: "New role assignments",
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoleAssignmentDto),
    __metadata("design:type", Array)
], UpdateUserRolesDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for role changes (required for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserRolesDto.prototype, "reason", void 0);
class ImpersonateUserDto {
    constructor() {
        this.durationMinutes = 15;
    }
}
exports.ImpersonateUserDto = ImpersonateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for impersonation (required for audit)" }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImpersonateUserDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Duration in minutes",
        default: 15,
        minimum: 5,
        maximum: 60,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(60),
    __metadata("design:type", Number)
], ImpersonateUserDto.prototype, "durationMinutes", void 0);
//# sourceMappingURL=user-management.dto.js.map