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
exports.EnrollmentService = void 0;
const common_1 = require("@nestjs/common");
const enroll_student_use_case_1 = require("../application/use-cases/enroll-student.use-case");
const remove_student_use_case_1 = require("../application/use-cases/remove-student.use-case");
const get_classroom_enrollments_use_case_1 = require("../application/use-cases/get-classroom-enrollments.use-case");
const get_student_enrollments_use_case_1 = require("../application/use-cases/get-student-enrollments.use-case");
let EnrollmentService = class EnrollmentService {
    constructor(enrollUseCase, removeUseCase, getClassroomEnrollmentsUseCase, getStudentEnrollmentsUseCase) {
        this.enrollUseCase = enrollUseCase;
        this.removeUseCase = removeUseCase;
        this.getClassroomEnrollmentsUseCase = getClassroomEnrollmentsUseCase;
        this.getStudentEnrollmentsUseCase = getStudentEnrollmentsUseCase;
    }
    async enroll(dto) {
        return this.enrollUseCase.execute(dto);
    }
    async remove(enrollmentId) {
        return this.removeUseCase.execute(enrollmentId);
    }
    async getByClassroom(classroomId) {
        return this.getClassroomEnrollmentsUseCase.execute(classroomId);
    }
    async getByStudent(learnerUserId) {
        return this.getStudentEnrollmentsUseCase.execute(learnerUserId);
    }
};
exports.EnrollmentService = EnrollmentService;
exports.EnrollmentService = EnrollmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [enroll_student_use_case_1.EnrollStudentUseCase,
        remove_student_use_case_1.RemoveStudentUseCase,
        get_classroom_enrollments_use_case_1.GetClassroomEnrollmentsUseCase,
        get_student_enrollments_use_case_1.GetStudentEnrollmentsUseCase])
], EnrollmentService);
//# sourceMappingURL=enrollment.service.js.map