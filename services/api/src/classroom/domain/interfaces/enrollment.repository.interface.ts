import { Enrollment } from "../entities/enrollment.entity";

export interface IEnrollmentRepository {
  enroll(enrollment: Enrollment): Promise<Enrollment>;
  find(classroomId: string, learnerUserId: string): Promise<Enrollment | null>;
  findById(id: string): Promise<Enrollment | null>;
  update(enrollment: Enrollment): Promise<Enrollment>;
  findByClassroom(classroomId: string): Promise<Enrollment[]>;
  findByStudent(learnerUserId: string): Promise<Enrollment[]>;
}

export const IEnrollmentRepository = Symbol("IEnrollmentRepository");
