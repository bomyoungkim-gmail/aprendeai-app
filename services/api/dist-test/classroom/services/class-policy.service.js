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
exports.ClassPolicyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const classroom_event_service_1 = require("../../events/classroom-event.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const crypto = require("crypto");
let ClassPolicyService = class ClassPolicyService {
    constructor(prisma, classroomEventService, promptLibrary) {
        this.prisma = prisma;
        this.classroomEventService = classroomEventService;
        this.promptLibrary = promptLibrary;
    }
    async upsert(dto) {
        var _a, _b, _c, _d, _e;
        const policy = await this.prisma.class_policies.upsert({
            where: { classroom_id: dto.classroomId },
            create: {
                id: crypto.randomUUID(),
                classrooms: { connect: { id: dto.classroomId } },
                weekly_units_target: (_a = dto.weeklyUnitsTarget) !== null && _a !== void 0 ? _a : 3,
                timebox_default_min: (_b = dto.timeboxDefaultMin) !== null && _b !== void 0 ? _b : 20,
                daily_review_cap: (_c = dto.dailyReviewCap) !== null && _c !== void 0 ? _c : 30,
                tool_words_gate_enabled: true,
                privacy_mode: (_d = dto.privacyMode) !== null && _d !== void 0 ? _d : "AGGREGATED_ONLY",
                intervention_mode: (_e = dto.interventionMode) !== null && _e !== void 0 ? _e : "PROMPT_COACH",
                updated_at: new Date(),
            },
            update: {
                weekly_units_target: dto.weeklyUnitsTarget,
                timebox_default_min: dto.timeboxDefaultMin,
                daily_review_cap: dto.dailyReviewCap,
                privacy_mode: dto.privacyMode,
                intervention_mode: dto.interventionMode,
                updated_at: new Date(),
            },
        });
        await this.classroomEventService.logPolicySet(`policy_${policy.classroom_id}`, dto.classroomId, {
            domain: "CLASS",
            type: "CLASS_POLICY_SET",
            data: {
                classroomId: dto.classroomId,
                policy: {
                    weeklyUnitsTarget: policy.weekly_units_target,
                    timeboxDefaultMin: policy.timebox_default_min,
                    toolWordsGateEnabled: policy.tool_words_gate_enabled,
                    dailyReviewCap: policy.daily_review_cap,
                    privacyMode: policy.privacy_mode,
                    interventionMode: policy.intervention_mode,
                },
            },
        });
        return policy;
    }
    async getByClassroom(classroomId) {
        return this.prisma.class_policies.findUnique({
            where: { classroom_id: classroomId },
        });
    }
    getPolicyPrompt(units, minutes) {
        return this.promptLibrary.getPrompt("CLASS_POLICY_SET", {
            UNITS: units,
            MIN: minutes,
        });
    }
};
exports.ClassPolicyService = ClassPolicyService;
exports.ClassPolicyService = ClassPolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        classroom_event_service_1.ClassroomEventService,
        prompt_library_service_1.PromptLibraryService])
], ClassPolicyService);
//# sourceMappingURL=class-policy.service.js.map