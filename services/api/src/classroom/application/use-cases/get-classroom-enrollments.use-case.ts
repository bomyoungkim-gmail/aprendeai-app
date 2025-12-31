import { Injectable, Inject } from '@nestjs/common';
import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';

@Injectable()
export class GetClassroomEnrollmentsUseCase {
  constructor(
    @Inject(IEnrollmentRepository) private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(classroomId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByClassroom(classroomId);
  }
}
