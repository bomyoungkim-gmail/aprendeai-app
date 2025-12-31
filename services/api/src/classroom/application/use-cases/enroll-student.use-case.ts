import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnrollStudentUseCase {
  constructor(
    @Inject(IEnrollmentRepository) private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(dto: { classroomId?: string; learnerUserId: string; nickname?: string }): Promise<Enrollment> {
    if (!dto.classroomId) {
      throw new BadRequestException('Classroom ID is required for enrollment');
    }
    const existing = await this.enrollmentRepo.find(dto.classroomId, dto.learnerUserId);

    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Student already enrolled in this classroom');
    }

    if (existing && existing.status === 'REMOVED') {
      const reactivated = new Enrollment(
        existing.id,
        existing.classroomId,
        existing.learnerUserId,
        dto.nickname ?? existing.nickname,
        'ACTIVE',
        existing.enrolledAt,
      );
      return this.enrollmentRepo.update(reactivated);
    }

    const enrollment = new Enrollment(
      uuidv4(),
      dto.classroomId,
      dto.learnerUserId,
      dto.nickname,
      'ACTIVE',
      new Date(),
    );

    return this.enrollmentRepo.enroll(enrollment);
  }
}
