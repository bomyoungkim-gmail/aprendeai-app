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
exports.EnrollStudentUseCase = void 0;
const common_1 = require("@nestjs/common");
const enrollment_repository_interface_1 = require("../../domain/interfaces/enrollment.repository.interface");
const enrollment_entity_1 = require("../../domain/entities/enrollment.entity");
const uuid_1 = require("uuid");
let EnrollStudentUseCase = class EnrollStudentUseCase {
    constructor(enrollmentRepo) {
        this.enrollmentRepo = enrollmentRepo;
    }
    async execute(dto) {
        var _a;
        if (!dto.classroomId) {
            throw new common_1.BadRequestException('Classroom ID is required for enrollment');
        }
        const existing = await this.enrollmentRepo.find(dto.classroomId, dto.learnerUserId);
        if (existing && existing.status === 'ACTIVE') {
            throw new common_1.BadRequestException('Student already enrolled in this classroom');
        }
        if (existing && existing.status === 'REMOVED') {
            const reactivated = new enrollment_entity_1.Enrollment(existing.id, existing.classroomId, existing.learnerUserId, (_a = dto.nickname) !== null && _a !== void 0 ? _a : existing.nickname, 'ACTIVE', existing.enrolledAt);
            return this.enrollmentRepo.update(reactivated);
        }
        const enrollment = new enrollment_entity_1.Enrollment((0, uuid_1.v4)(), dto.classroomId, dto.learnerUserId, dto.nickname, 'ACTIVE', new Date());
        return this.enrollmentRepo.enroll(enrollment);
    }
};
exports.EnrollStudentUseCase = EnrollStudentUseCase;
exports.EnrollStudentUseCase = EnrollStudentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(enrollment_repository_interface_1.IEnrollmentRepository)),
    __metadata("design:paramtypes", [Object])
], EnrollStudentUseCase);
//# sourceMappingURL=enroll-student.use-case.js.map