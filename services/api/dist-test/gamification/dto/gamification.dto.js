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
exports.ActivityProgressDto = exports.SetDailyGoalDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class SetDailyGoalDto {
}
exports.SetDailyGoalDto = SetDailyGoalDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Goal type is required" }),
    (0, class_validator_1.IsEnum)(client_1.DailyGoalType, { message: "Goal type must be MINUTES or LESSONS" }),
    __metadata("design:type", String)
], SetDailyGoalDto.prototype, "goalType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Goal value is required" }),
    (0, class_validator_1.IsInt)({ message: "Goal value must be an integer" }),
    (0, class_validator_1.Min)(1, { message: "Goal value must be at least 1" }),
    (0, class_validator_1.Max)(1440, { message: "Goal value cannot exceed 1440 minutes (24 hours)" }),
    __metadata("design:type", Number)
], SetDailyGoalDto.prototype, "goalValue", void 0);
class ActivityProgressDto {
}
exports.ActivityProgressDto = ActivityProgressDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: "Minutes spent must be an integer" }),
    (0, class_validator_1.Min)(0, { message: "Minutes spent cannot be negative" }),
    (0, class_validator_1.Max)(1440, { message: "Minutes spent cannot exceed 24 hours" }),
    __metadata("design:type", Number)
], ActivityProgressDto.prototype, "minutesSpentDelta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: "Lessons completed must be an integer" }),
    (0, class_validator_1.Min)(0, { message: "Lessons completed cannot be negative" }),
    (0, class_validator_1.Max)(100, { message: "Lessons completed delta seems unreasonably high" }),
    (0, class_validator_1.Max)(100, { message: "Lessons completed delta seems unreasonably high" }),
    __metadata("design:type", Number)
], ActivityProgressDto.prototype, "lessonsCompletedDelta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityProgressDto.prototype, "focusScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityProgressDto.prototype, "accuracyRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityProgressDto.prototype, "activityType", void 0);
//# sourceMappingURL=gamification.dto.js.map