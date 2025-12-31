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
exports.TeachBackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const family_event_service_1 = require("../../events/family-event.service");
let TeachBackService = class TeachBackService {
    constructor(prisma, promptLibrary, familyEventService) {
        this.prisma = prisma;
        this.promptLibrary = promptLibrary;
        this.familyEventService = familyEventService;
    }
    offerMission(childUserId) {
        return this.promptLibrary.getPrompt("TB_OFFER_MISSION");
    }
    async start(dto) {
        var _a;
        const session = await this.prisma.co_reading_sessions.create({
            data: {
                id: crypto.randomUUID(),
                family_id: dto.familyId,
                learner_user_id: dto.parentUserId,
                educator_user_id: dto.childUserId,
                reading_session_id: dto.baseReadingSessionId,
                thread_id_learner: `thread_tb_parent_${Date.now()}`,
                thread_id_educator: `thread_tb_child_${Date.now()}`,
                timebox_min: (_a = dto.durationMin) !== null && _a !== void 0 ? _a : 7,
                type: "TEACH_BACK",
                status: "ACTIVE",
            },
        });
        await this.familyEventService.logCoSessionStarted(dto.baseReadingSessionId, dto.childUserId, {
            domain: "FAMILY",
            type: "CO_SESSION_STARTED",
            data: {
                householdId: dto.familyId,
                coSessionId: session.id,
                learnerUserId: dto.parentUserId,
                educatorUserId: dto.childUserId,
                readingSessionId: dto.baseReadingSessionId,
                contentId: "TEACH_BACK_CONTENT",
                timeboxMin: session.timebox_min,
            },
        });
        const childPrompt = this.promptLibrary.getPrompt("TB_STEP1_EXPLAIN", {
            W1: "palavra1",
            W2: "palavra2",
        });
        const parentPrompt = this.promptLibrary.getPrompt("TB_PARENT_SUMMARY");
        return {
            session,
            nextPrompts: {
                child: childPrompt,
                parent: parentPrompt,
            },
        };
    }
    getStep2Prompt() {
        return this.promptLibrary.getPrompt("TB_STEP2_EXAMPLE", {
            W3: "palavra3",
        });
    }
    getStep3Prompt() {
        return this.promptLibrary.getPrompt("TB_STEP3_QUESTIONS");
    }
    calculateStars(usedTargetWords, askedOpenQuestions) {
        let stars = 0;
        if (usedTargetWords)
            stars += 1;
        if (askedOpenQuestions)
            stars += 1;
        stars += 1;
        return Math.min(stars, 3);
    }
    async finish(sessionId, stars) {
        await this.prisma.co_reading_sessions.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                ended_at: new Date(),
            },
        });
        return this.promptLibrary.getPrompt("TB_REWARD", { STARS: stars });
    }
};
exports.TeachBackService = TeachBackService;
exports.TeachBackService = TeachBackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_library_service_1.PromptLibraryService,
        family_event_service_1.FamilyEventService])
], TeachBackService);
//# sourceMappingURL=teachback.service.js.map