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
exports.FamilyPolicyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const family_event_service_1 = require("../../events/family-event.service");
const family_classroom_config_1 = require("../../config/family-classroom.config");
const family_policy_mapper_1 = require("../../mappers/family-policy.mapper");
const crypto = require("crypto");
let FamilyPolicyService = class FamilyPolicyService {
    constructor(prisma, promptLibrary, familyEventService) {
        this.prisma = prisma;
        this.promptLibrary = promptLibrary;
        this.familyEventService = familyEventService;
    }
    async create(dto) {
        var _a, _b, _c, _d, _e, _f;
        const policy = await this.prisma.family_policies.create({
            data: {
                id: crypto.randomUUID(),
                family_id: dto.familyId,
                learner_user_id: dto.learnerUserId,
                timebox_default_min: (_a = dto.timeboxDefaultMin) !== null && _a !== void 0 ? _a : family_classroom_config_1.FAMILY_CONFIG.POLICY.DEFAULT_TIMEBOX_MIN,
                daily_min_minutes: (_b = dto.dailyMinMinutes) !== null && _b !== void 0 ? _b : family_classroom_config_1.FAMILY_CONFIG.POLICY.DEFAULT_DAILY_MIN_MINUTES,
                daily_review_cap: (_c = dto.dailyReviewCap) !== null && _c !== void 0 ? _c : family_classroom_config_1.FAMILY_CONFIG.POLICY.DEFAULT_DAILY_REVIEW_CAP,
                co_reading_days: (_d = dto.coReadingDays) !== null && _d !== void 0 ? _d : [],
                co_reading_time: dto.coReadingTime,
                tool_words_gate_enabled: (_e = dto.toolWordsGateEnabled) !== null && _e !== void 0 ? _e : true,
                privacy_mode: (_f = dto.privacyMode) !== null && _f !== void 0 ? _f : family_classroom_config_1.FAMILY_CONFIG.POLICY.DEFAULT_PRIVACY_MODE,
                updated_at: new Date(),
            },
            include: {
                families: true,
                users: true,
            },
        });
        await this.familyEventService.logPolicySet(`policy_${policy.id}`, dto.learnerUserId, {
            domain: "FAMILY",
            type: "FAMILY_POLICY_SET",
            data: {
                householdId: dto.familyId,
                learnerUserId: dto.learnerUserId,
                policy: {
                    timeboxDefaultMin: policy.timebox_default_min,
                    coReadingDays: policy.co_reading_days,
                    coReadingTime: policy.co_reading_time || "",
                    toolWordsGateEnabled: policy.tool_words_gate_enabled,
                    dailyMinMinutes: policy.daily_min_minutes,
                    dailyReviewCap: policy.daily_review_cap,
                    privacyMode: policy.privacy_mode,
                },
            },
        });
        return family_policy_mapper_1.FamilyPolicyMapper.toDto(policy);
    }
    async getByFamilyAndLearner(familyId, learnerUserId) {
        const policy = await this.prisma.family_policies.findUnique({
            where: {
                family_id_learner_user_id: {
                    family_id: familyId,
                    learner_user_id: learnerUserId,
                },
            },
            include: {
                families: true,
                users: true,
            },
        });
        if (!policy) {
            throw new common_1.NotFoundException(`Policy not found for family ${familyId} and learner ${learnerUserId}`);
        }
        return family_policy_mapper_1.FamilyPolicyMapper.toDto(policy);
    }
    async update(familyId, learnerUserId, dto) {
        const policy = await this.prisma.family_policies.update({
            where: {
                family_id_learner_user_id: {
                    family_id: familyId,
                    learner_user_id: learnerUserId,
                },
            },
            data: {
                timebox_default_min: dto.timeboxDefaultMin,
                daily_min_minutes: dto.dailyMinMinutes,
                daily_review_cap: dto.dailyReviewCap,
                co_reading_days: dto.coReadingDays,
                co_reading_time: dto.coReadingTime,
                tool_words_gate_enabled: dto.toolWordsGateEnabled,
                privacy_mode: dto.privacyMode,
                updated_at: new Date(),
            },
        });
        await this.familyEventService.logPolicySet(`policy_${policy.id}`, learnerUserId, {
            domain: "FAMILY",
            type: "FAMILY_POLICY_SET",
            data: {
                householdId: familyId,
                learnerUserId,
                policy: {
                    timeboxDefaultMin: policy.timebox_default_min,
                    coReadingDays: policy.co_reading_days,
                    coReadingTime: policy.co_reading_time || "",
                    toolWordsGateEnabled: policy.tool_words_gate_enabled,
                    dailyMinMinutes: policy.daily_min_minutes,
                    dailyReviewCap: policy.daily_review_cap,
                    privacyMode: policy.privacy_mode,
                },
            },
        });
        return family_policy_mapper_1.FamilyPolicyMapper.toDto(policy);
    }
    async getConfirmationPrompt(policyId) {
        const policy = await this.prisma.family_policies.findUnique({
            where: { id: policyId },
        });
        if (!policy) {
            throw new common_1.NotFoundException(`Policy ${policyId} not found`);
        }
        return this.promptLibrary.getPrompt("FAM_CONTRACT_CONFIRM", {
            MIN: policy.timebox_default_min,
        });
    }
    getOnboardingPrompt() {
        return this.promptLibrary.getPrompt("FAM_ONBOARD_START");
    }
    getPrivacyModePrompt() {
        return this.promptLibrary.getPrompt("FAM_PRIVACY_MODE");
    }
};
exports.FamilyPolicyService = FamilyPolicyService;
exports.FamilyPolicyService = FamilyPolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_library_service_1.PromptLibraryService,
        family_event_service_1.FamilyEventService])
], FamilyPolicyService);
//# sourceMappingURL=family-policy.service.js.map