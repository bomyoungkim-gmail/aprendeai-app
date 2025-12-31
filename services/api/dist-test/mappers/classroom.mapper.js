"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomMapper = void 0;
class ClassroomMapper {
    static toDto(classroom) {
        var _a;
        if (!classroom)
            return null;
        return {
            id: classroom.id,
            institutionId: classroom.institutionId || classroom.institution_id,
            ownerEducatorUserId: classroom.ownerEducatorId || classroom.owner_educator_id,
            name: classroom.name,
            description: null,
            gradeLevel: classroom.gradeLevel || classroom.grade_level,
            status: "ACTIVE",
            accessCode: null,
            studentUnenrollmentMode: "TEACHER_ONLY",
            metadata: null,
            createdAt: classroom.createdAt || classroom.created_at,
            updatedAt: classroom.updatedAt || classroom.updated_at,
            enrollments: (_a = classroom.enrollments) === null || _a === void 0 ? void 0 : _a.map((e) => ({
                id: e.id,
                classroomId: e.classroomId || e.classroom_id,
                learnerUserId: e.learnerUserId || e.learner_user_id,
                status: e.status,
                nickname: e.nickname,
                enrolledAt: e.enrolledAt || e.enrolled_at,
            })),
        };
    }
    static toCollectionDto(classrooms) {
        return classrooms.map((c) => this.toDto(c));
    }
}
exports.ClassroomMapper = ClassroomMapper;
//# sourceMappingURL=classroom.mapper.js.map