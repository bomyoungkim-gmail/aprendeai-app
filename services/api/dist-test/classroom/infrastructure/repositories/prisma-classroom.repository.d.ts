import { PrismaService } from '../../../prisma/prisma.service';
import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
import { Classroom } from '../../domain/entities/classroom.entity';
export declare class PrismaClassroomRepository implements IClassroomRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(classroom: Classroom): Promise<Classroom>;
    findById(id: string): Promise<Classroom | null>;
    findByEducator(educatorId: string): Promise<Classroom[]>;
    update(classroom: Classroom): Promise<Classroom>;
    delete(id: string): Promise<void>;
    countEnrollments(classroomId: string): Promise<number>;
    private mapToEntity;
}
