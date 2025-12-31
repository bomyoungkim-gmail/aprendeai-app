"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentMapper = void 0;
class EnrollmentMapper {
    static toDto(enrollment) {
        if (!enrollment)
            return null;
        return {
            id: enrollment.id,
            classroomId: enrollment.classroomId || enrollment.classroom_id,
            learnerUserId: enrollment.learnerUserId || enrollment.learner_user_id,
            status: enrollment.status,
            nickname: enrollment.nickname,
            enrolledAt: enrollment.enrolledAt || enrollment.enrolled_at,
        };
    }
    static toCollectionDto(enrollments) {
        return enrollments.map((e) => this.toDto(e));
    }
}
exports.EnrollmentMapper = EnrollmentMapper;
//# sourceMappingURL=enrollment.mapper.js.map