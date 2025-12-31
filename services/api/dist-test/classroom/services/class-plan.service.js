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
exports.ClassPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const classroom_event_service_1 = require("../../events/classroom-event.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const uuid_1 = require("uuid");
let ClassPlanService = class ClassPlanService {
    constructor(prisma, classroomEventService, promptLibrary) {
        this.prisma = prisma;
        this.classroomEventService = classroomEventService;
        this.promptLibrary = promptLibrary;
    }
    async createWeeklyPlan(classroomId, weekStart, educatorUserId, items, toolWords) {
        const normalizedWeekStart = new Date(weekStart);
        normalizedWeekStart.setDate(normalizedWeekStart.getDate() - normalizedWeekStart.getDay());
        normalizedWeekStart.setHours(0, 0, 0, 0);
        const plan = await this.prisma.class_plan_weeks.create({
            data: {
                classrooms: { connect: { id: classroomId } },
                users: { connect: { id: educatorUserId } },
                week_start: normalizedWeekStart,
                items_json: items,
                tool_words_json: toolWords || null,
                id: (0, uuid_1.v4)(),
                updated_at: new Date(),
            },
        });
        await this.classroomEventService.logWeeklyPlanCreated(`plan_${plan.id}`, classroomId, {
            domain: "CLASS",
            type: "CLASS_WEEKLY_PLAN_CREATED",
            data: {
                classroomId,
                weekStart: weekStart.toISOString(),
                itemCount: items.length,
                toolWordCount: (toolWords === null || toolWords === void 0 ? void 0 : toolWords.length) || 0,
            },
        });
        return plan;
    }
    async getCurrentWeekPlan(classroomId) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return this.prisma.class_plan_weeks.findUnique({
            where: {
                classroom_id_week_start: {
                    classroom_id: classroomId,
                    week_start: weekStart,
                },
            },
        });
    }
    getWeeklyPlanPrompt(unitsTarget) {
        return this.promptLibrary.getPrompt("CLASS_WEEKLY_PLAN", {
            UNITS: unitsTarget,
        });
    }
    async getPlans(classroomId) {
        return this.prisma.class_plan_weeks.findMany({
            where: { classroom_id: classroomId },
            orderBy: { week_start: "desc" },
        });
    }
};
exports.ClassPlanService = ClassPlanService;
exports.ClassPlanService = ClassPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        classroom_event_service_1.ClassroomEventService,
        prompt_library_service_1.PromptLibraryService])
], ClassPlanService);
//# sourceMappingURL=class-plan.service.js.map