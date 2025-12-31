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
exports.PermissionEvaluator = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionEvaluator = class PermissionEvaluator {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canCreateClassroom(userId) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.last_institution_id)
            return false;
        if (user.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
            user.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN") {
            return true;
        }
        if (user.last_context_role !== "TEACHER")
            return false;
        const tv = await this.prisma.teacher_verifications.findUnique({
            where: { user_id: userId },
        });
        return (tv === null || tv === void 0 ? void 0 : tv.status) === "VERIFIED";
    }
    async canExportGradebook(userId, classroomId) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.last_institution_id)
            return false;
        if (user.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
            user.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN") {
            return true;
        }
        if (user.last_context_role !== "TEACHER")
            return false;
        const tv = await this.prisma.teacher_verifications.findUnique({
            where: { user_id: userId },
        });
        return (tv === null || tv === void 0 ? void 0 : tv.status) === "VERIFIED";
    }
    async canUnenrollStudent(actorId, classroomId) {
        var _a;
        const actor = await this.prisma.users.findUnique({
            where: { id: actorId },
        });
        if (!actor || !actor.last_institution_id)
            return false;
        const policy = await this.prisma.institution_policies.findUnique({
            where: { institution_id: actor.last_institution_id },
        });
        const mode = (_a = policy === null || policy === void 0 ? void 0 : policy.student_unenrollment_mode) !== null && _a !== void 0 ? _a : "TEACHER_OR_ADMIN_ONLY";
        if (mode !== "TEACHER_OR_ADMIN_ONLY") {
            return false;
        }
        if (actor.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
            actor.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN") {
            return true;
        }
        if (actor.last_context_role !== "TEACHER") {
            return false;
        }
        const tv = await this.prisma.teacher_verifications.findUnique({
            where: { user_id: actorId },
        });
        return (tv === null || tv === void 0 ? void 0 : tv.status) === "VERIFIED";
    }
};
exports.PermissionEvaluator = PermissionEvaluator;
exports.PermissionEvaluator = PermissionEvaluator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionEvaluator);
//# sourceMappingURL=permission.evaluator.js.map