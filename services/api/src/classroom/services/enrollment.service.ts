import { Injectable } from "@nestjs/common";
import { EnrollStudentDto } from "../dto/classroom.dto";
import { EnrollStudentUseCase } from "../application/use-cases/enroll-student.use-case";
import { RemoveStudentUseCase } from "../application/use-cases/remove-student.use-case";
import { GetClassroomEnrollmentsUseCase } from "../application/use-cases/get-classroom-enrollments.use-case";
import { GetStudentEnrollmentsUseCase } from "../application/use-cases/get-student-enrollments.use-case";

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollUseCase: EnrollStudentUseCase,
    private readonly removeUseCase: RemoveStudentUseCase,
    private readonly getClassroomEnrollmentsUseCase: GetClassroomEnrollmentsUseCase,
    private readonly getStudentEnrollmentsUseCase: GetStudentEnrollmentsUseCase,
  ) {}

  /**
   * Enroll a student in a classroom
   */
  async enroll(dto: EnrollStudentDto) {
    return this.enrollUseCase.execute(dto);
  }

  /**
   * Remove student from classroom
   */
  async remove(enrollmentId: string) {
    return this.removeUseCase.execute(enrollmentId);
  }

  /**
   * Get all enrollments for a classroom
   */
  async getByClassroom(classroomId: string) {
    return this.getClassroomEnrollmentsUseCase.execute(classroomId);
  }

  /**
   * Get all classrooms a student is enrolled in
   */
  async getByStudent(learnerUserId: string) {
    return this.getStudentEnrollmentsUseCase.execute(learnerUserId);
  }
}
