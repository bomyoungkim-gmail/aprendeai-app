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
exports.CoReadingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const family_event_service_1 = require("../../events/family-event.service");
const co_reading_state_machine_service_1 = require("../../state-machine/co-reading-state-machine.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const types_1 = require("../../state-machine/types");
const co_reading_session_mapper_1 = require("../../mappers/co-reading-session.mapper");
let CoReadingService = class CoReadingService {
    constructor(prisma, familyEventService, stateMachine, promptLibrary) {
        this.prisma = prisma;
        this.familyEventService = familyEventService;
        this.stateMachine = stateMachine;
        this.promptLibrary = promptLibrary;
    }
    async start(dto) {
        var _a;
        const coSession = await this.prisma.co_reading_sessions.create({
            data: {
                id: crypto.randomUUID(),
                family_id: dto.familyId,
                learner_user_id: dto.learnerUserId,
                educator_user_id: dto.educatorUserId,
                reading_session_id: dto.readingSessionId,
                thread_id_learner: `thread_learner_${Date.now()}`,
                thread_id_educator: `thread_educator_${Date.now()}`,
                timebox_min: (_a = dto.timeboxMin) !== null && _a !== void 0 ? _a : 20,
                type: "CO_READING",
                status: "ACTIVE",
            },
        });
        await this.familyEventService.logCoSessionStarted(dto.readingSessionId, dto.educatorUserId, {
            domain: "FAMILY",
            type: "CO_SESSION_STARTED",
            data: {
                householdId: dto.familyId,
                coSessionId: coSession.id,
                learnerUserId: dto.learnerUserId,
                educatorUserId: dto.educatorUserId,
                readingSessionId: dto.readingSessionId,
                contentId: dto.contentId,
                timeboxMin: coSession.timebox_min,
            },
        });
        const context = {
            coSessionId: coSession.id,
            householdId: dto.familyId,
            learnerUserId: dto.learnerUserId,
            educatorUserId: dto.educatorUserId,
            readingSessionId: dto.readingSessionId,
            currentPhase: types_1.CoReadingPhase.BOOT,
            timeboxMin: coSession.timebox_min,
            checkpointFailCount: 0,
            startedAt: new Date(),
            phaseStartedAt: new Date(),
        };
        const learnerPrompt = this.promptLibrary.getPrompt("OPS_DAILY_BOOT_LEARNER");
        const educatorPrompt = this.promptLibrary.getPrompt("OPS_DAILY_BOOT_EDUCATOR", {
            DAYS: "hoje",
        });
        return {
            coSession: co_reading_session_mapper_1.CoReadingSessionMapper.toDto(coSession),
            context,
            nextPrompts: {
                learner: learnerPrompt,
                educator: educatorPrompt,
            },
        };
    }
    async transitionPhase(coSessionId, targetPhase, context) {
        const result = await this.stateMachine.transition(context, targetPhase);
        if (result.success) {
            if (targetPhase === types_1.CoReadingPhase.CLOSE) {
                await this.prisma.co_reading_sessions.update({
                    where: { id: coSessionId },
                    data: {
                        status: "COMPLETED",
                        ended_at: new Date(),
                    },
                });
            }
            const nextPrompt = result.nextPromptKey
                ? this.promptLibrary.getPrompt(result.nextPromptKey)
                : null;
            return {
                success: true,
                newPhase: result.newPhase,
                nextPrompt,
            };
        }
        throw new common_1.BadRequestException(result.message);
    }
    async handleCheckpointFail(context) {
        const result = await this.stateMachine.handleCheckpointFail(context);
        if (result.shouldIntervene) {
            const interventionPrompt = this.promptLibrary.getPrompt("EDU_INTERVENTION_MENU");
            return {
                shouldIntervene: true,
                failCount: result.count,
                educatorPrompt: interventionPrompt,
            };
        }
        return {
            shouldIntervene: false,
            failCount: result.count,
        };
    }
    async getById(coSessionId) {
        return this.prisma.co_reading_sessions.findUnique({
            where: { id: coSessionId },
            include: {
                families: true,
                users_learner: true,
                users_educator: true,
                reading_sessions: true,
            },
        });
    }
    async finish(coSessionId, context) {
        const result = await this.stateMachine.close(context);
        await this.prisma.co_reading_sessions.update({
            where: { id: coSessionId },
            data: {
                status: "COMPLETED",
                ended_at: new Date(),
            },
        });
        return result;
    }
};
exports.CoReadingService = CoReadingService;
exports.CoReadingService = CoReadingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        family_event_service_1.FamilyEventService,
        co_reading_state_machine_service_1.CoReadingStateMachine,
        prompt_library_service_1.PromptLibraryService])
], CoReadingService);
//# sourceMappingURL=co-reading.service.js.map