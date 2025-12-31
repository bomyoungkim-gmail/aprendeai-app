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
exports.UpdateFamilyPolicyDto = exports.CreateFamilyPolicyDto = void 0;
const class_validator_1 = require("class-validator");
class CreateFamilyPolicyDto {
    constructor() {
        this.timeboxDefaultMin = 15;
        this.dailyMinMinutes = 15;
        this.dailyReviewCap = 20;
        this.coReadingDays = [];
        this.toolWordsGateEnabled = true;
        this.privacyMode = "AGGREGATED_ONLY";
    }
}
exports.CreateFamilyPolicyDto = CreateFamilyPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyPolicyDto.prototype, "familyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyPolicyDto.prototype, "learnerUserId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFamilyPolicyDto.prototype, "timeboxDefaultMin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFamilyPolicyDto.prototype, "dailyMinMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFamilyPolicyDto.prototype, "dailyReviewCap", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(0),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateFamilyPolicyDto.prototype, "coReadingDays", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFamilyPolicyDto.prototype, "coReadingTime", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFamilyPolicyDto.prototype, "toolWordsGateEnabled", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["AGGREGATED_ONLY", "AGGREGATED_PLUS_TRIGGERS"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFamilyPolicyDto.prototype, "privacyMode", void 0);
class UpdateFamilyPolicyDto {
}
exports.UpdateFamilyPolicyDto = UpdateFamilyPolicyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFamilyPolicyDto.prototype, "timeboxDefaultMin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFamilyPolicyDto.prototype, "dailyMinMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFamilyPolicyDto.prototype, "dailyReviewCap", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(0),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateFamilyPolicyDto.prototype, "coReadingDays", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFamilyPolicyDto.prototype, "coReadingTime", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateFamilyPolicyDto.prototype, "toolWordsGateEnabled", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["AGGREGATED_ONLY", "AGGREGATED_PLUS_TRIGGERS"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFamilyPolicyDto.prototype, "privacyMode", void 0);
//# sourceMappingURL=family-policy.dto.js.map