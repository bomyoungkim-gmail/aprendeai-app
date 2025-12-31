import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment, EnrollmentStatus } from '../../domain/entities/enrollment.entity';

@Injectable()
export class PrismaEnrollmentRepository implements IEnrollmentRepository {
  constructor(private prisma: PrismaService) {}

  async enroll(enrollment: Enrollment): Promise<Enrollment> {
    const created = await this.prisma.enrollments.create({
      data: {
        id: enrollment.id,
        classroom_id: enrollment.classroomId,
        learner_user_id: enrollment.learnerUserId,
        nickname: enrollment.nickname,
        status: enrollment.status,
      },
    });

    return this.mapToEntity(created);
  }

  async find(classroomId: string, learnerUserId: string): Promise<Enrollment | null> {
    const enrollment = await this.prisma.enrollments.findFirst({
      where: {
        classroom_id: classroomId,
        learner_user_id: learnerUserId,
      },
    });

    if (!enrollment) return null;
    return this.mapToEntity(enrollment);
  }

  async findById(id: string): Promise<Enrollment | null> {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { id },
    });

    if (!enrollment) return null;
    return this.mapToEntity(enrollment);
  }

  async update(enrollment: Enrollment): Promise<Enrollment> {
    const updated = await this.prisma.enrollments.update({
      where: { id: enrollment.id },
      data: {
        status: enrollment.status,
        nickname: enrollment.nickname,
      },
    });

    return this.mapToEntity(updated);
  }

  async findByClassroom(classroomId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        classroom_id: classroomId,
        status: 'ACTIVE',
      },
    });

    return enrollments.map(e => this.mapToEntity(e));
  }

  async findByStudent(learnerUserId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        learner_user_id: learnerUserId,
        status: 'ACTIVE',
      },
    });

    return enrollments.map(e => this.mapToEntity(e));
  }

  private mapToEntity(data: any): Enrollment {
    return new Enrollment(
      data.id,
      data.classroom_id,
      data.learner_user_id,
      data.nickname,
      data.status as EnrollmentStatus,
      data.created_at, // Mapping from Prisma's default created_at
    );
  }
}
