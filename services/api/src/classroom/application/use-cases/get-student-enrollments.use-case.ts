import { Injectable, Inject } from "@nestjs/common";
import { IEnrollmentRepository } from "../../domain/interfaces/enrollment.repository.interface";
import { Enrollment } from "../../domain/entities/enrollment.entity";

@Injectable()
export class GetStudentEnrollmentsUseCase {
  constructor(
    @Inject(IEnrollmentRepository)
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(learnerUserId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByStudent(learnerUserId);
  }
}
