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
exports.GetDashboardPromptDto = exports.GetInterventionPromptDto = exports.GetWeeklyPlanPromptDto = exports.GetPolicyPromptDto = exports.LogInterventionDto = exports.CreateWeeklyPlanDto = exports.CreateClassPolicyDto = exports.EnrollStudentDto = exports.UpdateClassroomDto = exports.CreateClassroomDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateClassroomDto {
}
exports.CreateClassroomDto = CreateClassroomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClassroomDto.prototype, "ownerEducatorUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClassroomDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClassroomDto.prototype, "institutionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClassroomDto.prototype, "gradeLevel", void 0);
class UpdateClassroomDto {
}
exports.UpdateClassroomDto = UpdateClassroomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClassroomDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClassroomDto.prototype, "gradeLevel", void 0);
class EnrollStudentDto {
}
exports.EnrollStudentDto = EnrollStudentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrollStudentDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollStudentDto.prototype, "learnerUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrollStudentDto.prototype, "nickname", void 0);
class CreateClassPolicyDto {
    constructor() {
        this.weeklyUnitsTarget = 3;
        this.timeboxDefaultMin = 20;
        this.dailyReviewCap = 30;
        this.privacyMode = "AGGREGATED_ONLY";
        this.interventionMode = "PROMPT_COACH";
    }
}
exports.CreateClassPolicyDto = CreateClassPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClassPolicyDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateClassPolicyDto.prototype, "weeklyUnitsTarget", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateClassPolicyDto.prototype, "timeboxDefaultMin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateClassPolicyDto.prototype, "dailyReviewCap", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        "AGGREGATED_ONLY",
        "AGGREGATED_PLUS_HELP_REQUESTS",
        "AGGREGATED_PLUS_FLAGS",
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClassPolicyDto.prototype, "privacyMode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["PROMPT_COACH", "PROMPT_COACH_PLUS_1ON1"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClassPolicyDto.prototype, "interventionMode", void 0);
class CreateWeeklyPlanDto {
}
exports.CreateWeeklyPlanDto = CreateWeeklyPlanDto;
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateWeeklyPlanDto.prototype, "weekStart", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateWeeklyPlanDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateWeeklyPlanDto.prototype, "toolWords", void 0);
class LogInterventionDto {
}
exports.LogInterventionDto = LogInterventionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogInterventionDto.prototype, "learnerUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogInterventionDto.prototype, "topic", void 0);
class GetPolicyPromptDto {
}
exports.GetPolicyPromptDto = GetPolicyPromptDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetPolicyPromptDto.prototype, "units", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetPolicyPromptDto.prototype, "minutes", void 0);
class GetWeeklyPlanPromptDto {
}
exports.GetWeeklyPlanPromptDto = GetWeeklyPlanPromptDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetWeeklyPlanPromptDto.prototype, "unitsTarget", void 0);
class GetInterventionPromptDto {
}
exports.GetInterventionPromptDto = GetInterventionPromptDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetInterventionPromptDto.prototype, "studentName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetInterventionPromptDto.prototype, "topic", void 0);
class GetDashboardPromptDto {
}
exports.GetDashboardPromptDto = GetDashboardPromptDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetDashboardPromptDto.prototype, "activeCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetDashboardPromptDto.prototype, "avgComprehension", void 0);
//# sourceMappingURL=classroom.dto.js.map