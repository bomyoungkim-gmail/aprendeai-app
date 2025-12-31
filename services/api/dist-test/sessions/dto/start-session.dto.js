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
exports.FinishSessionDto = exports.StartSessionDto = exports.LongTextConfigDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
class LongTextConfigDto {
}
exports.LongTextConfigDto = LongTextConfigDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LongTextConfigDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LongTextConfigDto.prototype, "unitIndex", void 0);
class StartSessionDto {
}
exports.StartSessionDto = StartSessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSessionDto.prototype, "contentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSessionDto.prototype, "contentVersionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.AssetLayer),
    __metadata("design:type", String)
], StartSessionDto.prototype, "assetLayer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ReadingIntent),
    __metadata("design:type", String)
], StartSessionDto.prototype, "readingIntent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(60),
    __metadata("design:type", Number)
], StartSessionDto.prototype, "timeboxMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", LongTextConfigDto)
], StartSessionDto.prototype, "longText", void 0);
class FinishSessionDto {
}
exports.FinishSessionDto = FinishSessionDto;
__decorate([
    (0, class_validator_1.IsEnum)(["USER_FINISHED", "TIMEOUT", "ERROR"]),
    __metadata("design:type", String)
], FinishSessionDto.prototype, "reason", void 0);
//# sourceMappingURL=start-session.dto.js.map