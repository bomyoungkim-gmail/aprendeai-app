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
exports.RemoveStudentUseCase = void 0;
const common_1 = require("@nestjs/common");
const enrollment_repository_interface_1 = require("../../domain/interfaces/enrollment.repository.interface");
const enrollment_entity_1 = require("../../domain/entities/enrollment.entity");
let RemoveStudentUseCase = class RemoveStudentUseCase {
    constructor(enrollmentRepo) {
        this.enrollmentRepo = enrollmentRepo;
    }
    async execute(enrollmentId) {
        const existing = await this.enrollmentRepo.findById(enrollmentId);
        if (!existing) {
            throw new common_1.NotFoundException(`Enrollment ${enrollmentId} not found`);
        }
        const updated = new enrollment_entity_1.Enrollment(existing.id, existing.classroomId, existing.learnerUserId, existing.nickname, 'REMOVED', existing.enrolledAt);
        await this.enrollmentRepo.update(updated);
    }
};
exports.RemoveStudentUseCase = RemoveStudentUseCase;
exports.RemoveStudentUseCase = RemoveStudentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(enrollment_repository_interface_1.IEnrollmentRepository)),
    __metadata("design:paramtypes", [Object])
], RemoveStudentUseCase);
//# sourceMappingURL=remove-student.use-case.js.map