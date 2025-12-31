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
exports.ClassDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const classroom_privacy_guard_service_1 = require("../../privacy/classroom-privacy-guard.service");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
const types_1 = require("../../privacy/types");
let ClassDashboardService = class ClassDashboardService {
    constructor(prisma, privacyGuard, promptLibrary) {
        this.prisma = prisma;
        this.privacyGuard = privacyGuard;
        this.promptLibrary = promptLibrary;
    }
    async getTeacherDashboard(classroomId) {
        const classroom = await this.prisma.classrooms.findUnique({
            where: { id: classroomId },
            include: {
                enrollments: {
                    where: { status: "ACTIVE" },
                    include: {
                        users: true,
                    },
                },
            },
        });
        if (!classroom) {
            throw new Error(`Classroom ${classroomId} not found`);
        }
        const policy = await this.prisma.class_policies.findUnique({
            where: { classroom_id: classroomId },
        });
        const privacyMode = (policy === null || policy === void 0 ? void 0 : policy.privacy_mode) ||
            types_1.ClassPrivacyMode.AGGREGATED_ONLY;
        const studentsData = await Promise.all(classroom.enrollments.map(async (enrollment) => {
            return this.calculateStudentStats(enrollment.learner_user_id);
        }));
        const filteredStudents = this.privacyGuard.filterStudentList(studentsData, privacyMode);
        const activeCount = classroom.enrollments.length;
        const avgProgress = studentsData.reduce((sum, s) => sum + (s.progressPercent || 0), 0) /
            (activeCount || 1);
        return {
            classroomId,
            className: classroom.name,
            activeStudents: activeCount,
            avgProgress: Math.round(avgProgress),
            students: filteredStudents,
            privacyMode,
        };
    }
    async calculateStudentStats(learnerUserId) {
        var _a;
        const sessions = await this.prisma.reading_sessions.findMany({
            where: { user_id: learnerUserId },
            orderBy: { started_at: "desc" },
            take: 10,
        });
        const progressPercent = sessions.length > 0 ? 65 : 0;
        const comprehensionScore = 72;
        const lastActivityDate = ((_a = sessions[0]) === null || _a === void 0 ? void 0 : _a.started_at) || null;
        return {
            learnerUserId,
            progressPercent,
            comprehensionScore,
            lastActivityDate,
            helpRequests: [],
            struggles: [],
        };
    }
    getDashboardPrompt(activeCount, avgComprehension) {
        return this.promptLibrary.getPrompt("CLASS_DASHBOARD", {
            ACTIVE: activeCount,
            AVG: avgComprehension,
        });
    }
};
exports.ClassDashboardService = ClassDashboardService;
exports.ClassDashboardService = ClassDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        classroom_privacy_guard_service_1.ClassroomPrivacyGuard,
        prompt_library_service_1.PromptLibraryService])
], ClassDashboardService);
//# sourceMappingURL=class-dashboard.service.js.map