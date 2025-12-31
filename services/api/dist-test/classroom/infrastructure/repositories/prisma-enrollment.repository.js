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
exports.PrismaEnrollmentRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const enrollment_entity_1 = require("../../domain/entities/enrollment.entity");
let PrismaEnrollmentRepository = class PrismaEnrollmentRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async enroll(enrollment) {
        const created = await this.prisma.enrollments.create({
            data: {
                id: enrollment.id,
                classroom_id: enrollment.classroomId,
                learner_user_id: enrollment.learnerUserId,
                nickname: enrollment.nickname,
                status: enrollment.status,
            },
        });
        return this.mapToEntity(created);
    }
    async find(classroomId, learnerUserId) {
        const enrollment = await this.prisma.enrollments.findFirst({
            where: {
                classroom_id: classroomId,
                learner_user_id: learnerUserId,
            },
        });
        if (!enrollment)
            return null;
        return this.mapToEntity(enrollment);
    }
    async findById(id) {
        const enrollment = await this.prisma.enrollments.findUnique({
            where: { id },
        });
        if (!enrollment)
            return null;
        return this.mapToEntity(enrollment);
    }
    async update(enrollment) {
        const updated = await this.prisma.enrollments.update({
            where: { id: enrollment.id },
            data: {
                status: enrollment.status,
                nickname: enrollment.nickname,
            },
        });
        return this.mapToEntity(updated);
    }
    async findByClassroom(classroomId) {
        const enrollments = await this.prisma.enrollments.findMany({
            where: {
                classroom_id: classroomId,
                status: 'ACTIVE',
            },
        });
        return enrollments.map(e => this.mapToEntity(e));
    }
    async findByStudent(learnerUserId) {
        const enrollments = await this.prisma.enrollments.findMany({
            where: {
                learner_user_id: learnerUserId,
                status: 'ACTIVE',
            },
        });
        return enrollments.map(e => this.mapToEntity(e));
    }
    mapToEntity(data) {
        return new enrollment_entity_1.Enrollment(data.id, data.classroom_id, data.learner_user_id, data.nickname, data.status, data.created_at);
    }
};
exports.PrismaEnrollmentRepository = PrismaEnrollmentRepository;
exports.PrismaEnrollmentRepository = PrismaEnrollmentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaEnrollmentRepository);
//# sourceMappingURL=prisma-enrollment.repository.js.map