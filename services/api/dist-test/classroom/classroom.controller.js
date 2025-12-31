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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/presentation/decorators/current-user.decorator");
const classroom_service_1 = require("./services/classroom.service");
const enrollment_service_1 = require("./services/enrollment.service");
const class_policy_service_1 = require("./services/class-policy.service");
const class_plan_service_1 = require("./services/class-plan.service");
const class_intervention_service_1 = require("./services/class-intervention.service");
const class_dashboard_service_1 = require("./services/class-dashboard.service");
const class_gradebook_service_1 = require("./services/class-gradebook.service");
const classroom_mapper_1 = require("../mappers/classroom.mapper");
const enrollment_mapper_1 = require("../mappers/enrollment.mapper");
const class_policy_mapper_1 = require("../mappers/class-policy.mapper");
const class_plan_mapper_1 = require("../mappers/class-plan.mapper");
const classroom_dto_1 = require("./dto/classroom.dto");
const teacher_verified_guard_1 = require("./guards/teacher-verified.guard");
let ClassroomController = class ClassroomController {
    constructor(classroomService, enrollmentService, classPolicyService, classPlanService, classInterventionService, classDashboardService, classGradebookService) {
        this.classroomService = classroomService;
        this.enrollmentService = enrollmentService;
        this.classPolicyService = classPolicyService;
        this.classPlanService = classPlanService;
        this.classInterventionService = classInterventionService;
        this.classDashboardService = classDashboardService;
        this.classGradebookService = classGradebookService;
    }
    async create(dto) {
        const classroom = await this.classroomService.create(dto);
        return classroom_mapper_1.ClassroomMapper.toDto(classroom);
    }
    async getById(id) {
        const classroom = await this.classroomService.getById(id);
        return classroom_mapper_1.ClassroomMapper.toDto(classroom);
    }
    async update(id, dto) {
        const classroom = await this.classroomService.update(id, dto);
        return classroom_mapper_1.ClassroomMapper.toDto(classroom);
    }
    async delete(id) {
        return this.classroomService.delete(id);
    }
    async getMyClassrooms(user) {
        return this.classroomService.getByEducator(user.id);
    }
    async enroll(classroomId, dto) {
        const enrollment = await this.enrollmentService.enroll(Object.assign(Object.assign({}, dto), { classroomId }));
        return enrollment_mapper_1.EnrollmentMapper.toDto(enrollment);
    }
    async getEnrollments(classroomId) {
        const enrollments = await this.enrollmentService.getByClassroom(classroomId);
        return enrollment_mapper_1.EnrollmentMapper.toCollectionDto(enrollments);
    }
    async upsertPolicy(classroomId, dto) {
        const policy = await this.classPolicyService.upsert(Object.assign(Object.assign({}, dto), { classroomId }));
        return class_policy_mapper_1.ClassPolicyMapper.toDto(policy);
    }
    async getPolicy(classroomId) {
        const policy = await this.classPolicyService.getByClassroom(classroomId);
        return class_policy_mapper_1.ClassPolicyMapper.toDto(policy);
    }
    async createWeeklyPlan(classroomId, req, dto) {
        const plan = await this.classPlanService.createWeeklyPlan(classroomId, dto.weekStart, req.user.id, dto.items, dto.toolWords);
        return class_plan_mapper_1.ClassPlanMapper.toDto(plan);
    }
    async getCurrentWeekPlan(classroomId) {
        const plan = await this.classPlanService.getCurrentWeekPlan(classroomId);
        return class_plan_mapper_1.ClassPlanMapper.toDto(plan);
    }
    async getDashboard(classroomId) {
        return this.classDashboardService.getTeacherDashboard(classroomId);
    }
    async logHelpRequest(classroomId, dto) {
        return this.classInterventionService.logHelpRequest(classroomId, dto.learnerUserId, dto.topic);
    }
    async getPolicyPrompt(classroomId, dto) {
        return this.classPolicyService.getPolicyPrompt(dto.units, dto.minutes);
    }
    async getWeeklyPlanPrompt(classroomId, dto) {
        return this.classPlanService.getWeeklyPlanPrompt(dto.unitsTarget);
    }
    async getInterventionPrompt(classroomId, dto) {
        return this.classInterventionService.getInterventionPrompt(dto.studentName, dto.topic);
    }
    async getDashboardPrompt(classroomId, dto) {
        return this.classDashboardService.getDashboardPrompt(dto.activeCount, dto.avgComprehension);
    }
    async getGradebook(classroomId) {
        return this.classGradebookService.getGradebook(classroomId);
    }
    async exportGradebook(classroomId) {
        const csv = await this.classGradebookService.exportGradebookCsv(classroomId);
        return { csv };
    }
    async getStudyItems(classroomId) {
        const plans = await this.classPlanService.getPlans(classroomId);
        return { plans: class_plan_mapper_1.ClassPlanMapper.toCollectionDto(plans) };
    }
};
exports.ClassroomController = ClassroomController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(teacher_verified_guard_1.TeacherVerifiedGuard),
    (0, swagger_1.ApiOperation)({ summary: "Create a new classroom" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [classroom_dto_1.CreateClassroomDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get classroom by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, common_1.UseGuards)(teacher_verified_guard_1.TeacherVerifiedGuard),
    (0, swagger_1.ApiOperation)({ summary: "Update classroom" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.UpdateClassroomDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(teacher_verified_guard_1.TeacherVerifiedGuard),
    (0, swagger_1.ApiOperation)({ summary: "Delete classroom" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)("mine"),
    (0, swagger_1.ApiOperation)({ summary: "Get my classrooms (for teacher)" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getMyClassrooms", null);
__decorate([
    (0, common_1.Post)(":id/enroll"),
    (0, common_1.UseGuards)(teacher_verified_guard_1.TeacherVerifiedGuard),
    (0, swagger_1.ApiOperation)({ summary: "Enroll student in classroom" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.EnrollStudentDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "enroll", null);
__decorate([
    (0, common_1.Get)(":id/enrollments"),
    (0, swagger_1.ApiOperation)({ summary: "Get all enrollments for classroom" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getEnrollments", null);
__decorate([
    (0, common_1.Post)(":id/policy"),
    (0, swagger_1.ApiOperation)({ summary: "Create or update classroom policy" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.CreateClassPolicyDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "upsertPolicy", null);
__decorate([
    (0, common_1.Get)(":id/policy"),
    (0, swagger_1.ApiOperation)({ summary: "Get classroom policy" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Post)(":id/plans/weekly"),
    (0, swagger_1.ApiOperation)({ summary: "Create weekly content plan" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, classroom_dto_1.CreateWeeklyPlanDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "createWeeklyPlan", null);
__decorate([
    (0, common_1.Get)(":id/plans/weekly"),
    (0, swagger_1.ApiOperation)({ summary: "Get current week plan" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getCurrentWeekPlan", null);
__decorate([
    (0, common_1.Get)(":id/dashboard"),
    (0, swagger_1.ApiOperation)({ summary: "Get teacher dashboard with privacy filtering" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)(":id/interventions"),
    (0, swagger_1.ApiOperation)({ summary: "Log student help request" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.LogInterventionDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "logHelpRequest", null);
__decorate([
    (0, common_1.Post)(":id/policy/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get policy configuration prompt" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.GetPolicyPromptDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getPolicyPrompt", null);
__decorate([
    (0, common_1.Post)(":id/plans/weekly/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get weekly planning prompt" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.GetWeeklyPlanPromptDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getWeeklyPlanPrompt", null);
__decorate([
    (0, common_1.Post)(":id/interventions/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get intervention prompt for help request" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.GetInterventionPromptDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getInterventionPrompt", null);
__decorate([
    (0, common_1.Post)(":id/dashboard/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get dashboard summary prompt" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, classroom_dto_1.GetDashboardPromptDto]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getDashboardPrompt", null);
__decorate([
    (0, common_1.Get)(":id/gradebook"),
    (0, swagger_1.ApiOperation)({ summary: "Get classroom gradebook grid" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getGradebook", null);
__decorate([
    (0, common_1.Get)(":id/gradebook/export"),
    (0, swagger_1.ApiOperation)({ summary: "Export gradebook as CSV" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "exportGradebook", null);
__decorate([
    (0, common_1.Get)(":id/study-items"),
    (0, swagger_1.ApiOperation)({ summary: "Get all study items (assignments) for classroom" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassroomController.prototype, "getStudyItems", null);
exports.ClassroomController = ClassroomController = __decorate([
    (0, swagger_1.ApiTags)("Classrooms"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("classrooms"),
    __metadata("design:paramtypes", [classroom_service_1.ClassroomService,
        enrollment_service_1.EnrollmentService,
        class_policy_service_1.ClassPolicyService,
        class_plan_service_1.ClassPlanService,
        class_intervention_service_1.ClassInterventionService,
        class_dashboard_service_1.ClassDashboardService,
        class_gradebook_service_1.ClassGradebookService])
], ClassroomController);
//# sourceMappingURL=classroom.controller.js.map