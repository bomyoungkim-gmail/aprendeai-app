import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IEnrollmentRepository } from "../../domain/interfaces/enrollment.repository.interface";
import { Enrollment } from "../../domain/entities/enrollment.entity";

@Injectable()
export class RemoveStudentUseCase {
  constructor(
    @Inject(IEnrollmentRepository)
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(enrollmentId: string): Promise<void> {
    const existing = await this.enrollmentRepo.findById(enrollmentId);
    if (!existing) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    const updated = new Enrollment(
      existing.id,
      existing.classroomId,
      existing.learnerUserId,
      existing.nickname,
      "REMOVED",
      existing.enrolledAt,
    );

    await this.enrollmentRepo.update(updated);
  }
}
