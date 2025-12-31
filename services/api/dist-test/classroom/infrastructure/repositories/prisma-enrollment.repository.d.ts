import { PrismaService } from '../../../prisma/prisma.service';
import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';
export declare class PrismaEnrollmentRepository implements IEnrollmentRepository {
    private prisma;
    constructor(prisma: PrismaService);
    enroll(enrollment: Enrollment): Promise<Enrollment>;
    find(classroomId: string, learnerUserId: string): Promise<Enrollment | null>;
    findById(id: string): Promise<Enrollment | null>;
    update(enrollment: Enrollment): Promise<Enrollment>;
    findByClassroom(classroomId: string): Promise<Enrollment[]>;
    findByStudent(learnerUserId: string): Promise<Enrollment[]>;
    private mapToEntity;
}
