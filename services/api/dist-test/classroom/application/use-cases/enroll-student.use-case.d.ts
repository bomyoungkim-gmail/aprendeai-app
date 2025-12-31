import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';
export declare class EnrollStudentUseCase {
    private readonly enrollmentRepo;
    constructor(enrollmentRepo: IEnrollmentRepository);
    execute(dto: {
        classroomId?: string;
        learnerUserId: string;
        nickname?: string;
    }): Promise<Enrollment>;
}
