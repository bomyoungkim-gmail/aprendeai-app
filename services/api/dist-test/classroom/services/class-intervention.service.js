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
exports.ClassInterventionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const classroom_event_service_1 = require("../../events/classroom-event.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
let ClassInterventionService = class ClassInterventionService {
    constructor(prisma, classroomEventService, promptLibrary) {
        this.prisma = prisma;
        this.classroomEventService = classroomEventService;
        this.promptLibrary = promptLibrary;
    }
    async logHelpRequest(classroomId, learnerUserId, topic) {
        await this.classroomEventService.logClassAlert(`help_${Date.now()}`, learnerUserId, {
            domain: "CLASS",
            type: "CLASS_ALERT_RAISED",
            data: {
                classroomId,
                learnerUserId,
                alertType: "HELP_REQUEST",
                severity: "MED",
            },
        });
        return {
            timestamp: new Date(),
            topic,
            status: "PENDING",
        };
    }
    getInterventionPrompt(studentName, topic) {
        return this.promptLibrary.getPrompt("CLASS_INTERVENTION_PROMPT", {
            NAME: studentName,
            TOPIC: topic,
        });
    }
    async canDo1on1(classroomId) {
        const policy = await this.prisma.class_policies.findUnique({
            where: { classroom_id: classroomId },
        });
        return (policy === null || policy === void 0 ? void 0 : policy.intervention_mode) === "PROMPT_COACH_PLUS_1ON1";
    }
    async getPendingHelpRequests(classroomId) {
        return [];
    }
};
exports.ClassInterventionService = ClassInterventionService;
exports.ClassInterventionService = ClassInterventionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        classroom_event_service_1.ClassroomEventService,
        prompt_library_service_1.PromptLibraryService])
], ClassInterventionService);
//# sourceMappingURL=class-intervention.service.js.map