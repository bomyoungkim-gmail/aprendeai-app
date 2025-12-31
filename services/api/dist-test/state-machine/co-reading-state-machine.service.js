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
var CoReadingStateMachine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoReadingStateMachine = void 0;
const common_1 = require("@nestjs/common");
const family_event_service_1 = require("../events/family-event.service");
const types_1 = require("./types");
let CoReadingStateMachine = CoReadingStateMachine_1 = class CoReadingStateMachine {
    constructor(familyEventService) {
        this.familyEventService = familyEventService;
        this.logger = new common_1.Logger(CoReadingStateMachine_1.name);
        this.PRE_TIMEOUT_MS = 2 * 60 * 1000;
    }
    canTransition(from, to) {
        var _a, _b;
        const validTransitions = {
            [types_1.CoReadingPhase.BOOT]: [types_1.CoReadingPhase.PRE],
            [types_1.CoReadingPhase.PRE]: [types_1.CoReadingPhase.DURING],
            [types_1.CoReadingPhase.DURING]: [types_1.CoReadingPhase.POST],
            [types_1.CoReadingPhase.POST]: [types_1.CoReadingPhase.CLOSE],
            [types_1.CoReadingPhase.CLOSE]: [],
        };
        return (_b = (_a = validTransitions[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) !== null && _b !== void 0 ? _b : false;
    }
    async transition(context, targetPhase) {
        const { currentPhase, coSessionId, readingSessionId, educatorUserId } = context;
        if (!this.canTransition(currentPhase, targetPhase)) {
            this.logger.warn(`Invalid transition: ${currentPhase} -> ${targetPhase} for session ${coSessionId}`);
            return {
                success: false,
                newPhase: currentPhase,
                message: `Cannot transition from ${currentPhase} to ${targetPhase}`,
            };
        }
        await this.familyEventService.logCoSessionPhaseChanged(readingSessionId, educatorUserId, {
            domain: "FAMILY",
            type: "CO_SESSION_PHASE_CHANGED",
            data: {
                coSessionId,
                phase: targetPhase,
            },
        });
        this.logger.log(`Phase transition: ${currentPhase} -> ${targetPhase} for session ${coSessionId}`);
        return {
            success: true,
            newPhase: targetPhase,
            nextPromptKey: this.getNextPromptKey(targetPhase, context),
        };
    }
    getNextPromptKey(phase, context) {
        switch (phase) {
            case types_1.CoReadingPhase.BOOT:
                return "OPS_DAILY_BOOT_LEARNER";
            case types_1.CoReadingPhase.PRE:
                return "READ_PRE_CHOICE_SKIM";
            case types_1.CoReadingPhase.DURING:
                return "READ_DURING_MARK_RULE";
            case types_1.CoReadingPhase.POST:
                return "READ_POST_FREE_RECALL";
            case types_1.CoReadingPhase.CLOSE:
                return "EDU_CLOSE_SCRIPT";
            default:
                return "OPS_QUEUE_NEXT";
        }
    }
    hasPreTimedOut(context) {
        if (context.currentPhase !== types_1.CoReadingPhase.PRE) {
            return false;
        }
        const elapsed = Date.now() - context.phaseStartedAt.getTime();
        return elapsed > this.PRE_TIMEOUT_MS;
    }
    hasDuringTimedOut(context) {
        if (context.currentPhase !== types_1.CoReadingPhase.DURING) {
            return false;
        }
        const timeboxMs = context.timeboxMin * 60 * 1000;
        const elapsed = Date.now() - context.startedAt.getTime();
        return elapsed > timeboxMs;
    }
    async handleCheckpointFail(context) {
        const newCount = context.checkpointFailCount + 1;
        if (newCount >= 2) {
            this.logger.log(`Checkpoint failed 2x for session ${context.coSessionId}, triggering intervention`);
            return { shouldIntervene: true, count: newCount };
        }
        return { shouldIntervene: false, count: newCount };
    }
    async boot(context) {
        return this.transition(context, types_1.CoReadingPhase.PRE);
    }
    async pre(context) {
        if (this.hasPreTimedOut(context)) {
            this.logger.log(`PRE timeout for session ${context.coSessionId}, offering skip`);
        }
        return this.transition(context, types_1.CoReadingPhase.DURING);
    }
    async during(context) {
        if (this.hasDuringTimedOut(context)) {
            this.logger.log(`Timebox exceeded for session ${context.coSessionId}, forcing POST`);
            return this.transition(context, types_1.CoReadingPhase.POST);
        }
        return this.transition(context, types_1.CoReadingPhase.POST);
    }
    async post(context) {
        return this.transition(context, types_1.CoReadingPhase.CLOSE);
    }
    async close(context) {
        await this.familyEventService.logCoSessionFinished(context.readingSessionId, context.educatorUserId, {
            domain: "FAMILY",
            type: "CO_SESSION_FINISHED",
            data: {
                coSessionId: context.coSessionId,
                result: "COMPLETED",
                durationMin: Math.round((Date.now() - context.startedAt.getTime()) / 60000),
                summary: {
                    targetWordsCount: 0,
                    checkpointCount: 0,
                    checkpointFailCount: context.checkpointFailCount,
                    productionSubmitted: true,
                },
            },
        });
        return {
            success: true,
            newPhase: types_1.CoReadingPhase.CLOSE,
            message: "Session completed",
        };
    }
};
exports.CoReadingStateMachine = CoReadingStateMachine;
exports.CoReadingStateMachine = CoReadingStateMachine = CoReadingStateMachine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [family_event_service_1.FamilyEventService])
], CoReadingStateMachine);
//# sourceMappingURL=co-reading-state-machine.service.js.map