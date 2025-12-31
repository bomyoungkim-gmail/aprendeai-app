export class EnrollmentMapper {
  static toDto(enrollment: any | null) {
    if (!enrollment) return null;

    return {
      id: enrollment.id,
      classroomId: enrollment.classroomId || enrollment.classroom_id,
      learnerUserId: enrollment.learnerUserId || enrollment.learner_user_id,
      status: enrollment.status,
      nickname: enrollment.nickname,
      enrolledAt: enrollment.enrolledAt || enrollment.enrolled_at,
    };
  }

  static toCollectionDto(enrollments: any[]) {
    return enrollments.map((e) => this.toDto(e));
  }
}
